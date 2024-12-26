import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { DAS } from "utils/types/das";

export function splTokenTransfer(
  owner: PublicKey,
  recipient: PublicKey,
  amount: number,
  asset: DAS.GetAssetResponse
) {
  const mint = new PublicKey(asset.id);
  const tokenProgram = new PublicKey(asset.token_info?.token_program!);
  const source = getAssociatedTokenAddressSync(mint, owner, true, tokenProgram);
  const destination = getAssociatedTokenAddressSync(
    mint,
    recipient,
    true,
    tokenProgram
  );
  const ataIx = createAssociatedTokenAccountIdempotentInstruction(
    owner,
    destination,
    recipient,
    mint,
    tokenProgram
  );
  const transferIx = createTransferCheckedInstruction(
    source,
    mint,
    destination,
    owner,
    amount,
    asset.token_info?.decimals || 0,
    undefined,
    tokenProgram
  );

  return [ataIx, transferIx];
}
