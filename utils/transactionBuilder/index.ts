import {
  AddressLookupTableAccount,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SendTransactionError,
  TransactionInstruction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { logError } from "utils/firebase";
import { JITO_API_URL } from "../consts";
import { TransactionSigner } from "../types";

export async function getPriorityFeeEstimate(
  connection: Connection,
  testInstructions: TransactionInstruction[],
  payer: string,
  lookupTables: AddressLookupTableAccount[] = []
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
          ),
          options: { recommended: true, transactionEncoding: "base64" },
        },
      ],
    }),
  });

  const data = await response.json();

  if (data.error) {
    logError(data.error);
    throw new Error(data.error.message);
  } else {
    return data.result.priorityFeeEstimate as number;
  }
}

export async function getSimulationUnits(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: string,
  lookupTables: AddressLookupTableAccount[] = []
): Promise<number | undefined> {
  const simulation = await simulateTransaction(
    connection,
    instructions,
    payer,
    lookupTables,
    true,
    false,
    true
  );
  if (simulation.value.err) {
    return undefined;
  }
  return simulation.value.unitsConsumed;
}

export async function simulateTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: string,
  lookupTables: AddressLookupTableAccount[] = [],
  replaceRecentBlockhash = true,
  sigVerify = false,
  innerInstructions = true
) {
  const testVersionedTxn = new VersionedTransaction(
    new TransactionMessage({
      instructions,
      payerKey: new PublicKey(payer),
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(lookupTables)
  );
  const simulation = await connection.simulateTransaction(testVersionedTxn, {
    replaceRecentBlockhash,
    sigVerify,
    innerInstructions,
  });
  return simulation;
}

export async function getFeesFromTx(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: string,
  lookupTables: AddressLookupTableAccount[],
  blockhash?: string
): Promise<number | null> {
  const testVersionedTxn = new VersionedTransaction(
    new TransactionMessage({
      instructions,
      payerKey: new PublicKey(payer),
      recentBlockhash: blockhash || PublicKey.default.toString(),
    }).compileToV0Message(lookupTables)
  );

  return (await connection.getFeeForMessage(testVersionedTxn.message)).value;
}

export async function pollTransactionConfirmation(
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
          preflightCommitment: "confirmed",
        });

        return await pollTransactionConfirmation(connection, txtSig);
      } catch (error) {
        logError(error);
        if (error instanceof SendTransactionError) {
          throw new Error(`${error.message}`);
        }
        continue;
      }
    }
    throw new Error(`Transaction ${txtSig}'s confirmation timed out`);
  } catch (error) {
    logError(error);
    throw new Error(`${error.message}`);
  }
}

export async function pollAndSendJitoBundle(
  serializedTransaction: string[]
): Promise<TransactionSignature> {
  const bundleId = await sendJitoBundle(serializedTransaction);
  return await pollJitoBundleForConfirmation(bundleId);
}

export async function sendJitoBundle(serializedTransactions: string[]) {
  const response = await fetch(JITO_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "sendBundle",
      params: [
        serializedTransactions,
        {
          encoding: "base64",
        },
      ],
    }),
  });
  const data = await response.json();

  if (data.error) {
    logError(data.error);
    throw new Error(
      `Error sending bundles: ${JSON.stringify(data.error, null, 2)}`
    );
  }
  return data.result;
}

export async function pollJitoBundleForConfirmation(bundleId: string) {
  const timeout = 60000;
  const interval = 5000;
  const startTime = Date.now();

  let lastStatus = "";
  while (Date.now() - startTime < timeout) {
    try {
      const bundleStatus = await getJitoBundleStatus([bundleId]);

      const status = bundleStatus.value[0]?.status ?? "Unknown";

      if (status !== lastStatus) {
        lastStatus = status;
      }

      if (status === "Landed") {
        return bundleId;
      }

      if (status === "Failed") {
        throw new Error(`Bundle failed with status: ${status}`);
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    } catch {
      break;
    }
  }
  throw new Error("Transaction failed to confirm within the timeout period");
}

export const getJitoBundleStatus = async (bundleIds: string[]) => {
  const response = await fetch(JITO_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getInflightBundleStatuses",
      params: [bundleIds],
    }),
  });
  const data = await response.json();
  if (data.error) {
    logError(data.error);
    throw new Error(
      `Error getting bundle statuses: ${JSON.stringify(data.error, null, 2)}`
    );
  }
  return data.result;
};

export const estimateFees = async (
  connection: Connection,
  ixs: TransactionInstruction[],
  feePayer: string,
  signers: TransactionSigner[],
  lookUpTables?: AddressLookupTableAccount[]
) => {
  let [microLamports, units] = await Promise.all([
    getPriorityFeeEstimate(connection, ixs, feePayer, lookUpTables),
    getSimulationUnits(connection, ixs, feePayer, lookUpTables),
  ]);

  microLamports = Math.ceil(microLamports);
  units = units ? Math.max(Math.ceil(units) * 1.1, 10000) : undefined;

  const numSigners = new Set();
  ixs.forEach((ix) => {
    ix.keys
      .filter((x) => x.isSigner && PublicKey.isOnCurve(x.pubkey))
      .forEach((x) => numSigners.add(x.pubkey.toString()));
  });
  signers.forEach((x) => numSigners.add(x.key.toString()));
  const totalFees = Math.ceil(
    LAMPORTS_PER_SOL * 0.000005 * numSigners.size -
      1 +
      (microLamports * (units ? units : 200_000)) / 1_000_000
  );
  return { microLamports, units, totalFees };
};

export const estimateJitoTips = async () => {
  const response = await fetch(
    "https://bundles.jito.wtf/api/v1/bundles/tip_floor"
  );
  const result = await response.json();
  const tipAmount = Math.round(
    result[0]["ema_landed_tips_50th_percentile"] * LAMPORTS_PER_SOL
  ) as number;

  return tipAmount;
};
