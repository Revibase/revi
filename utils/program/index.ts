import { Program } from "@coral-xyz/anchor";
import {
  AddressLookupTableAccount,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { RPC_ENDPOINT } from "utils/consts";
import { TransactionSigner } from "utils/types/transaction";
import MultiWalletIdl from "./idl/multi_wallet.json";
import {
  getPriorityFeeEstimate,
  getSimulationUnits,
} from "./transactionBuilder";
import { MultiWallet } from "./types/multi_wallet";

export const program = new Program<MultiWallet>(MultiWalletIdl as MultiWallet, {
  connection: new Connection(RPC_ENDPOINT, "confirmed"),
});

export const estimateFees = async (
  connection: Connection,
  ixs: TransactionInstruction[],
  feePayer: PublicKey,
  signers: TransactionSigner[],
  lookUpTables?: AddressLookupTableAccount[]
) => {
  let [microLamports, units] = await Promise.all([
    getPriorityFeeEstimate(connection, ixs, feePayer, lookUpTables),
    getSimulationUnits(connection, ixs, feePayer, lookUpTables),
  ]);

  microLamports = Math.ceil(microLamports);
  units = units ? Math.ceil(units) * 1.1 : undefined;

  const numSigners = new Set();
  ixs.forEach((ix) => {
    ix.keys
      .filter((x) => x.isSigner && PublicKey.isOnCurve(x.pubkey))
      .forEach((x) => numSigners.add(x.pubkey.toString()));
  });
  signers.forEach((x) => numSigners.add(x.key.toString()));
  const totalFees = Math.ceil(
    LAMPORTS_PER_SOL * 0.000005 * numSigners.size -
      1 +
      (microLamports * (units ? units : 200_000)) / 1_000_000
  );
  return { microLamports, units, totalFees };
};
