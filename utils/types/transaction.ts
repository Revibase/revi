import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { SignerType } from "utils/program/transactionBuilder";

export interface TransactionArgs {
  feePayer: Signer;
  signers: Signer[];
  ixs: TransactionInstruction[];
  lookUpTables?: AddressLookupTableAccount[];
}

export interface Signer {
  key: PublicKey;
  type: SignerType;
  state: SignerState;
}
export enum SignerState {
  Signed,
  Unsigned,
  Error,
}
