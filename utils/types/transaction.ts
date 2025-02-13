import { Member } from "@revibase/multi-wallet";
import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { ThemeName } from "tamagui";
import { EscrowActions, SignerType } from "../enums";
import { WalletInfo } from "./walletInfo";
type ConfigAction =
  | {
      type: "addMembers";
      members: Member[];
    }
  | {
      type: "removeMembers";
      members: PublicKey[];
    }
  | {
      type: "setMembers";
      members: Member[];
    }
  | {
      type: "setThreshold";
      threshold: number;
    }
  | {
      type: "setMetadata";
      metadata: PublicKey | null;
    };
interface TransactionSheetArgsBase {
  walletAddress: string;
  feePayer: string;
  theme?: ThemeName | null;
  error?: string;
  callback?: (signature?: string) => void;
  lookUpTables?: AddressLookupTableAccount[];
}

type WithWalletInfo = {
  walletInfo: WalletInfo;
  signers?: never;
};

type WithSigners = {
  signers: TransactionSigner[];
  walletInfo?: never;
};

type WithIxs = {
  ixs: TransactionInstruction[];
  changeConfig?: never;
  escrowConfig?: never;
  tx?: never;
};

type WithTx = {
  tx: VersionedTransaction;
  changeConfig?: never;
  escrowConfig?: never;
  ixs?: never;
};

type WithChangeConfig = {
  changeConfig: ConfigAction[];
  ixs?: never;
  tx?: never;
  escrowConfig?: never;
};

type WithEscrowConfig = {
  escrowConfig: {
    identifier: number;
    type: EscrowActions.AcceptEscrowAsOwner | EscrowActions.CancelEscrowAsOwner;
    proposer: string;
  };
  ixs?: never;
  tx?: never;
  changeConfig?: never;
};
type MembersOrSignersWithActions =
  | (WithWalletInfo & (WithEscrowConfig | WithChangeConfig | WithIxs | WithTx))
  | (WithSigners & (WithChangeConfig | WithIxs | WithEscrowConfig | WithTx));

export type TransactionSheetArgs = TransactionSheetArgsBase &
  MembersOrSignersWithActions;

export interface TransactionSigner {
  key: string;
  type: SignerType;
  state: SignerState;
}
export enum SignerState {
  Signed,
  Unsigned,
  Error,
}

export interface TransactionResult {
  feePayer: string;
  data: {
    id: string;
    signers: TransactionSigner[];
    feePayer: string;
    ixs?: TransactionInstruction[];
    tx?: VersionedTransaction;
    lookUpTables?: AddressLookupTableAccount[];
  }[];
  totalFees: number | null;
}
