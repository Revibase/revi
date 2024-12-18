import {
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { SignerType } from "utils/enums/transaction";

export interface TransactionArgs {
  signers: TransactionSigner[];
  ixs: TransactionInstruction[];
  callback?: () => void;
  lookUpTables?: AddressLookupTableAccount[];
  microLamports?: number;
  units?: number;
  totalFees?: number;
}

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
