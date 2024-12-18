import {
  createTransferInstruction,
  Metadata,
  PROGRAM_ID,
  TransferInstructionAccounts,
  TransferInstructionArgs,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";
import { ADDRESS_LOOK_UP_TABLE } from "utils/consts";
import { DAS } from "utils/types/das";

const authorizationRulesProgram = new PublicKey(
  "auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg"
);

export async function programmableNftTransfer(
  connection: Connection,
  owner: PublicKey,
  recipient: PublicKey,
  amount: number,
  asset: DAS.GetAssetResponse
) {
  const tokenProgram = new PublicKey(asset.token_info?.token_program!);
  const mint = new PublicKey(asset.id);

  const ownerAta = getAssociatedTokenAddressSync(
    mint,
    owner,
    true,
    tokenProgram
  );
  const recipientAta = getAssociatedTokenAddressSync(
    mint,
    recipient,
    true,
    tokenProgram
  );
  const [metadata] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), PROGRAM_ID.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  );
  const [masterEdition] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    PROGRAM_ID
  );
  const [ownerTokenRecord] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("token_record"),
      ownerAta.toBuffer(),
    ],
    PROGRAM_ID
  );
  const [destinationTokenRecord] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("token_record"),
      recipientAta.toBuffer(),
    ],
    PROGRAM_ID
  );
  const metadataAccountInfo = await connection.getAccountInfo(metadata);

  if (!metadataAccountInfo) {
    throw new Error("Unable to find token metadata account info");
  }
  const metadataInfo = Metadata.fromAccountInfo(metadataAccountInfo, 0)[0];
  let authorizationRules: PublicKey | undefined;

  if (metadataInfo.programmableConfig) {
    authorizationRules = metadataInfo.programmableConfig.ruleSet ?? undefined;
  }

  const transferAcccounts: TransferInstructionAccounts = {
    authority: owner,
    tokenOwner: owner,
    token: ownerAta,
    metadata,
    mint,
    edition: masterEdition,
    destinationOwner: recipient,
    destination: recipientAta,
    payer: owner,
    splTokenProgram: tokenProgram,
    splAtaProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    authorizationRules,
    authorizationRulesProgram,
    ownerTokenRecord,
    destinationTokenRecord,
  };

  const transferArgs: TransferInstructionArgs = {
    transferArgs: {
      __kind: "V1",
      amount,
      authorizationData: null,
    },
  };

  const transferIx = createTransferInstruction(transferAcccounts, transferArgs);

  const addressLookUpTable = (
    await connection.getAddressLookupTable(ADDRESS_LOOK_UP_TABLE)
  ).value;
  return {
    instructions: [transferIx],
    addressLookUpTable,
  };
}
