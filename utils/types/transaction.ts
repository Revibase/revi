import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { SignerType } from "utils/enums/transaction";

interface TransactionArgsBase {
  ixs?: TransactionInstruction[];
  changeConfig?: {
    newOwners: TransactionSigner[];
  };
  signers?: TransactionSigner[];
  walletInfo?: {
    members: Member[];
    threshold: number;
  };
  callback?: () => void;
  lookUpTables?: AddressLookupTableAccount[];
}

type Member = {
  pubkey: PublicKey;
  label: number | null;
};

type WithWalletInfo = {
  walletInfo: {
    members: Member[];
    threshold: number;
  };
  signers?: never;
};

type WithSigners = {
  signers: TransactionSigner[];
  walletInfo?: never;
};

type WithIxs = {
  ixs: TransactionInstruction[];
  changeConfig?: never;
};

type WithChangeConfig = {
  changeConfig: { newOwners: TransactionSigner[] };
  ixs?: never;
};
type MembersOrSignersWithActions =
  | (WithWalletInfo & (WithChangeConfig | WithIxs))
  | (WithSigners & (WithChangeConfig | WithIxs));

export type TransactionArgs = TransactionArgsBase & MembersOrSignersWithActions;

export interface TransactionSigner {
  key: PublicKey;
  type: SignerType;
  state: SignerState;
}
export enum SignerState {
  Signed,
  Unsigned,
  Error,
}
