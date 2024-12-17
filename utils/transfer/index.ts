import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { getAsset } from "utils/helper";
import { DAS } from "utils/types/das";
import { nativeTransfer } from "./nativeTransfer";
import { programmableNftTransfer } from "./programmableNftTransfer";
import { splTokenTransfer } from "./splTransfer";

export async function transferAsset(
  connection: Connection,
  source: PublicKey,
  destination: PublicKey,
  amount: number,
  isNative: boolean,
  asset?: DAS.GetAssetResponse | PublicKey
): Promise<{
  ixs: TransactionInstruction[];
  lookUpTables: AddressLookupTableAccount[];
}> {
  let ixs: TransactionInstruction[] = [];
  let lookUpTables: AddressLookupTableAccount[] = [];

  asset =
    asset instanceof PublicKey ? await getAsset(asset, connection) : asset;

  const amountNormalized =
    amount * 10 ** (isNative ? 9 : asset?.token_info?.decimals || 0);

  if (!asset) {
    if (isNative) {
      ixs = nativeTransfer(source, destination, amountNormalized);
    } else {
      throw new Error("Asset can't be undefined if it is a non native asset!");
    }
  } else if (asset.interface === "ProgrammableNFT") {
    let { instructions, addressLookUpTable } = await programmableNftTransfer(
      connection,
      source,
      destination,
      amountNormalized,
      asset
    );
    ixs = instructions;
    if (addressLookUpTable) {
      lookUpTables.push(addressLookUpTable);
    }
  } else if (asset.compression?.compressed) {
    // compressed nft
  } else if (asset.compressedToken) {
    // compressed zk token
  } else {
    ixs = splTokenTransfer(source, destination, amountNormalized, asset);
  }
  return { ixs, lookUpTables };
}
