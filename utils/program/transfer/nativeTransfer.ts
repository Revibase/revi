import { PublicKey, SystemProgram } from "@solana/web3.js";

export function nativeTransfer(
  source: PublicKey,
  destination: PublicKey,
  amount: number
) {
  return [
    SystemProgram.transfer({
      fromPubkey: source,
      toPubkey: destination,
      lamports: amount,
    }),
  ];
}
