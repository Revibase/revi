import { createTransferInstruction } from "@metaplex-foundation/mpl-bubblegum";
import { Connection, PublicKey } from "@solana/web3.js";
import { ADDRESS_LOOK_UP_TABLE } from "utils/consts";
import { getAssetProof } from "utils/helper";
import { DAS } from "utils/types/das";
const BUBBLEGUM_PROGRAM_ID = new PublicKey(
  "BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY"
);
const SPL_NOOP_PROGRAM_ID = new PublicKey(
  "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV"
);
const SPL_ACCOUNT_COMPRESSION_PROGRAM_ID = new PublicKey(
  "cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK"
);
export async function compressedNftTransfer(
  connection: Connection,
  owner: PublicKey,
  recipient: PublicKey,
  asset: DAS.GetAssetResponse
) {
  if (asset.compression?.compressed !== true) {
    throw new Error("Asset is not compressed!");
  }

  const assetProof = await getAssetProof(new PublicKey(asset.id), connection);

  if (!assetProof?.proof || assetProof.proof.length === 0) {
    throw new Error("Proof is empty");
  }
  let proofPath = assetProof.proof.map((node: string) => ({
    pubkey: new PublicKey(node),
    isSigner: false,
    isWritable: false,
  }));

  if (asset.ownership.owner !== owner.toString()) {
    throw new Error(
      `NFT is not owned by the expected owner. Expected ${owner.toString()} but got ${
        asset.ownership.owner
      }.`
    );
  }
  const leafNonce = asset.compression.leaf_id;
  const [treeAuthority] = PublicKey.findProgramAddressSync(
    [new PublicKey(assetProof.tree_id).toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  );
  const leafDelegate = asset.ownership.delegate
    ? new PublicKey(asset.ownership.delegate)
    : new PublicKey(asset.ownership.owner);
  let transferIx = createTransferInstruction(
    {
      treeAuthority,
      leafOwner: new PublicKey(asset.ownership.owner),
      leafDelegate: leafDelegate,
      newLeafOwner: recipient,
      merkleTree: new PublicKey(assetProof.tree_id),
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      anchorRemainingAccounts: proofPath,
    },
    {
      root: [...new PublicKey(assetProof.root.trim()).toBytes()],
      dataHash: [
        ...new PublicKey(asset.compression.data_hash.trim()).toBytes(),
      ],
      creatorHash: [
        ...new PublicKey(asset.compression.creator_hash.trim()).toBytes(),
      ],
      nonce: leafNonce,
      index: leafNonce,
    }
  );

  const addressLookUpTable = (
    await connection.getAddressLookupTable(ADDRESS_LOOK_UP_TABLE)
  ).value;

  return { instructions: [transferIx], addressLookUpTable };
}
