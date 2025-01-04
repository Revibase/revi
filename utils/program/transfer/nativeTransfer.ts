import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";

const TRANSACTION_FEE_AND_MINIMUM_RENT = LAMPORTS_PER_SOL * 0.0015; // Set your transaction fee estimate

export async function nativeTransfer(
  connection: Connection,
  source: PublicKey,
  destination: PublicKey,
  amount: number
): Promise<TransactionInstruction[]> {
  // Fetch the account info to get the source account's lamports
  const sourceAccountInfo = await connection.getAccountInfo(source);
  if (!sourceAccountInfo) {
    throw new Error("Source account does not exist");
  }

  const sourceLamports = sourceAccountInfo.lamports;

  // Ensure enough lamports are left for the transaction fee
  if (sourceLamports < amount + TRANSACTION_FEE_AND_MINIMUM_RENT) {
    // Adjust the transfer amount to leave enough for the transaction fee
    amount = sourceLamports - TRANSACTION_FEE_AND_MINIMUM_RENT;

    if (amount <= 0) {
      throw new Error(
        "Insufficient balance to make the transfer after accounting for transaction fee"
      );
    }
  }

  // Create the transfer instruction
  return [
    SystemProgram.transfer({
      fromPubkey: source,
      toPubkey: destination,
      lamports: amount,
    }),
  ];
}
