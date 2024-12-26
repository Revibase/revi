import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  SendTransactionError,
  TransactionInstruction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";

export async function getPriorityFeeEstimate(
  connection: Connection,
  testInstructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: AddressLookupTableAccount[] = [],
  blockhash?: string
) {
  const testVersionedTxn = new VersionedTransaction(
    new TransactionMessage({
      instructions: testInstructions,
      payerKey: payer,
      recentBlockhash: blockhash || PublicKey.default.toString(),
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

  return data.result.priorityFeeEstimate as number;
}

export async function getSimulationUnits(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: AddressLookupTableAccount[] = [],
  blockhash?: string
): Promise<number | undefined> {
  const testVersionedTxn = new VersionedTransaction(
    new TransactionMessage({
      instructions,
      payerKey: payer,
      recentBlockhash: blockhash || PublicKey.default.toString(),
    }).compileToV0Message(lookupTables)
  );
  const simulation = await connection.simulateTransaction(testVersionedTxn, {
    replaceRecentBlockhash: true,
    sigVerify: false,
    innerInstructions: true,
  });

  if (simulation.value.err) {
    return undefined;
  }
  return simulation.value.unitsConsumed;
}

export async function getFeesFromTx(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: AddressLookupTableAccount[],
  blockhash?: string
): Promise<number | null> {
  const testVersionedTxn = new VersionedTransaction(
    new TransactionMessage({
      instructions,
      payerKey: payer,
      recentBlockhash: blockhash || PublicKey.default.toString(),
    }).compileToV0Message(lookupTables)
  );

  return (await connection.getFeeForMessage(testVersionedTxn.message)).value;
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
          preflightCommitment: "confirmed",
        });

        return await pollTransactionConfirmation(connection, txtSig);
      } catch (error) {
        if (error instanceof SendTransactionError) {
          throw new Error(`${error.message}`);
        }
        continue;
      }
    }
    throw new Error(`Transaction ${txtSig}'s confirmation timed out`);
  } catch (error) {
    throw new Error(`${error.message}`);
  }
}
