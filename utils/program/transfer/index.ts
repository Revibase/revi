import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { getAsset } from "utils/helper";
import { DAS } from "utils/types/das";
import { compressedNftTransfer } from "./compressedNftTransfer";
import { nativeTransfer } from "./nativeTransfer";
import { programmableNftTransfer } from "./programmableNftTransfer";
import { splTokenTransfer } from "./splTransfer";

export async function transferAsset(
  connection: Connection,
  source: PublicKey,
  destination: PublicKey,
  amount: number,
  isNative: boolean = false,
  asset?: DAS.GetAssetResponse | PublicKey
): Promise<{
  ixs: TransactionInstruction[];
  lookUpTables: AddressLookupTableAccount[];
}> {
  let ixs: TransactionInstruction[] = [];
  let lookUpTables: AddressLookupTableAccount[] = [];
  asset =
    asset instanceof PublicKey ? await getAsset(asset, connection) : asset;
  const amountNormalized = Math.round(
    amount * 10 ** (isNative ? 9 : asset?.token_info?.decimals || 0)
  );
  if (isNative) {
    ixs = await nativeTransfer(
      connection,
      source,
      destination,
      amountNormalized
    );
  } else {
    if (!asset) {
      throw new Error("Asset can't be undefined if it is a non native asset!");
    }
    if (asset.interface === "ProgrammableNFT") {
      const { instructions, addressLookUpTable } =
        await programmableNftTransfer(
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
      const { instructions, addressLookUpTable } = await compressedNftTransfer(
        connection,
        source,
        destination,
        asset
      );
      ixs = instructions;
      if (addressLookUpTable) {
        lookUpTables.push(addressLookUpTable);
      }
    } else if (asset.compressedToken) {
      // compressed zk token (TBD)
    } else {
      ixs = splTokenTransfer(source, destination, amountNormalized, asset);
    }
  }
  return { ixs, lookUpTables };
}
