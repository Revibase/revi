import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { CloudStorage } from "react-native-cloud-storage";
import { retrieveCloudKeypair } from "utils/queries/useGetCloudPublicKey";
import { retrieveDeviceKeypair } from "utils/queries/useGetDevicePublicKey";
import { Signer, SignerState, TransactionArgs } from "utils/types/transaction";
import { nfcSignTransction } from "../commands";

async function getPriorityFeeEstimate(
  testInstructions: TransactionInstruction[],
  payer: PublicKey,
  connection: Connection,
  lookupTables: AddressLookupTableAccount[]
) {
  const testVersionedTxn = new VersionedTransaction(
    new TransactionMessage({
      instructions: testInstructions,
      payerKey: new PublicKey(payer),
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(lookupTables)
  );
  const response = await fetch(connection.rpcEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "1",
      method: "getPriorityFeeEstimate",
      params: [
        {
          transaction: Buffer.from(testVersionedTxn.serialize()).toString(
            "base64"
          ), // Pass the serialized transaction in Base58
          options: { recommended: true, transactionEncoding: "base64" },
        },
      ],
    }),
  });
  const data = await response.json();
  console.log("Recommended Fee: ", data.result.priorityFeeEstimate);
  return data.result.priorityFeeEstimate;
}

export async function getSimulationUnits(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: AddressLookupTableAccount[]
): Promise<number | undefined> {
  const testInstructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1400000 }),
    ...instructions,
  ];
  const testVersionedTxn = new VersionedTransaction(
    new TransactionMessage({
      instructions: testInstructions,
      payerKey: new PublicKey(payer),
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(lookupTables)
  );
  const simulation = await connection.simulateTransaction(testVersionedTxn, {
    replaceRecentBlockhash: true,
    sigVerify: false,
  });
  if (simulation.value.err) {
    return undefined;
  }
  return simulation.value.unitsConsumed;
}

export enum SignerType {
  DEVICE = "Device Wallet",
  CLOUD = "Cloud Wallet",
  NFC = "Hardware Wallet",
}
export async function buildAndSignTransaction({
  connection,
  cloudStorage,
  args,
  callback,
}: {
  connection: Connection;
  callback: (signer: Signer) => void;
  args: TransactionArgs;
  cloudStorage?: CloudStorage;
}): Promise<VersionedTransaction> {
  const { feePayer, signers, ixs, lookUpTables } = args;
  const tx = await buildTransaction({
    connection,
    feePayer: feePayer.key,
    ixs,
    lookUpTables,
  });
  const seenKeys = new Set();

  await Promise.all(
    signers
      .filter((signer) => {
        if (seenKeys.has(signer.key)) {
          return false;
        }
        seenKeys.add(signer.key);
        return true;
      })
      .sort((a, _) => (a.type == SignerType.NFC ? -1 : 1)) // if NFC signature is needed sign that first
      .map(async (signer) => {
        if (signer.type == SignerType.NFC) {
          const signature = await nfcSignTransction(tx);
          if (signature) {
            tx.addSignature(signer.key, new Uint8Array(signature));
            callback({
              key: signer.key,
              type: signer.type,
              state: SignerState.Signed,
            });
          } else {
            callback({
              key: signer.key,
              type: signer.type,
              state: SignerState.Error,
            });
            throw Error("Unable to get signature from hardware wallet");
          }
        } else if (signer.type == SignerType.DEVICE) {
          const keypair = await retrieveDeviceKeypair();
          if (keypair) {
            tx.sign([keypair]);
            callback({
              key: signer.key,
              type: signer.type,
              state: SignerState.Signed,
            });
          } else {
            callback({
              key: signer.key,
              type: signer.type,
              state: SignerState.Error,
            });
            throw Error("Unable to get signature from device wallet");
          }
        } else if (signer.type == SignerType.CLOUD && cloudStorage) {
          const keypair = await retrieveCloudKeypair(cloudStorage);
          if (keypair) {
            tx.sign([keypair]);
            callback({
              key: signer.key,
              type: signer.type,
              state: SignerState.Signed,
            });
          } else {
            callback({
              key: signer.key,
              type: signer.type,
              state: SignerState.Error,
            });
            throw Error("Unable to get signature from cloud wallet");
          }
        }
      })
  );
  return tx;
}

export async function signTransaction(
  signer: {
    key: PublicKey;
    type: SignerType;
    signed: boolean;
  },
  tx: VersionedTransaction,
  cloudStorage?: CloudStorage
) {
  if (signer.type == SignerType.NFC) {
    const signature = await nfcSignTransction(tx);
    if (signature) {
      tx.addSignature(signer.key, new Uint8Array(signature));
    } else {
      return;
    }
  } else if (signer.type == SignerType.DEVICE) {
    const keypair = await retrieveDeviceKeypair();
    if (keypair) {
      tx.sign([keypair]);
    } else {
      return;
    }
  } else if (signer.type == SignerType.CLOUD && cloudStorage) {
    const keypair = await retrieveCloudKeypair(cloudStorage);
    if (keypair) {
      tx.sign([keypair]);
    } else {
      return;
    }
  }
  return tx;
}

export async function buildTransaction({
  connection,
  feePayer,
  ixs,
  lookUpTables,
}: {
  connection: Connection;
  feePayer: PublicKey;
  ixs?: TransactionInstruction[];
  lookUpTables?: AddressLookupTableAccount[];
}) {
  if (ixs && ixs.length > 0) {
    const [microLamports, units, recentBlockhash] = await Promise.all([
      getPriorityFeeEstimate(ixs, feePayer, connection, []),
      getSimulationUnits(connection, ixs, feePayer, []),
      connection.getLatestBlockhash({ commitment: "processed" }),
    ]);

    ixs.unshift(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: Math.round(microLamports),
      })
    );
    if (units) {
      ixs.unshift(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: Math.max(Math.round(units * 1.1), 5000),
        })
      );
      console.log(`Compute Units: ${Math.max(Math.round(units * 1.1), 5000)}`);
    }
    const tx = new VersionedTransaction(
      new TransactionMessage({
        instructions: ixs,
        recentBlockhash: recentBlockhash.blockhash,
        payerKey: new PublicKey(feePayer),
      }).compileToV0Message(lookUpTables)
    );
    if (tx.message.serialize().length > 900) {
      throw Error("Transaction size cannot exceed 900 bytes");
    }
    return tx;
  } else {
    throw Error("Undefined instructions");
  }
}

async function pollTransactionConfirmation(
  connection: Connection,
  txtSig: TransactionSignature
): Promise<TransactionSignature> {
  // 15 second timeout
  const timeout = 15000;
  // 5 second retry interval
  const interval = 5000;
  let elapsed = 0;

  return new Promise<TransactionSignature>((resolve, reject) => {
    const intervalId = setInterval(async () => {
      elapsed += interval;

      if (elapsed >= timeout) {
        clearInterval(intervalId);
        reject(new Error(`Transaction ${txtSig}'s confirmation timed out`));
      }

      const status = await connection.getSignatureStatus(txtSig);

      if (status?.value?.confirmationStatus === "confirmed") {
        clearInterval(intervalId);
        resolve(txtSig);
      }
    }, interval);
  });
}
export async function pollAndSendTransaction(
  connection: Connection,
  transaction: VersionedTransaction
): Promise<TransactionSignature> {
  try {
    const timeout = 60000;
    const startTime = Date.now();
    let txtSig = "";

    while (Date.now() - startTime < timeout) {
      try {
        txtSig = await connection.sendTransaction(transaction, {
          maxRetries: 0,
        });

        return await pollTransactionConfirmation(connection, txtSig);
      } catch (error) {
        continue;
      }
    }
    throw new Error(`Transaction ${txtSig}'s confirmation timed out`);
  } catch (error) {
    throw new Error(`${error}`);
  }
}
