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
  const tokenProgram = new PublicKey(asset.token_info?.token_program!);
  const source = getAssociatedTokenAddressSync(
    new PublicKey(asset.id),
    owner,
    true,
    tokenProgram
  );
  const destination = getAssociatedTokenAddressSync(
    new PublicKey(asset.id),
    new PublicKey(recipient),
    true,
    tokenProgram
  );
  const ataIx = createAssociatedTokenAccountIdempotentInstruction(
    owner,
    destination,
    new PublicKey(recipient),
    new PublicKey(asset.id),
    tokenProgram
  );
  const transferIx = createTransferCheckedInstruction(
    source,
    new PublicKey(asset.id),
    destination,
    owner,
    amount,
    asset.token_info?.decimals || 0,
    undefined,
    tokenProgram
  );

  return [ataIx, transferIx];
}
