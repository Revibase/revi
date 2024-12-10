import {
  PublicKey,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { SignerType } from "utils/program/transactionBuilder";

export interface TransactionArgs {
  feePayer: PublicKey;
  signers: {
    key: PublicKey;
    type: SignerType;
    signed: boolean;
  }[];
  ixs: TransactionInstruction[];
  tx?: VersionedTransaction;
}
