import { Program } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { RPC_ENDPOINT } from "utils/consts";
import MultiWalletIdl from "./idl/multi_wallet.json";
import { MultiWallet } from "./types/multi_wallet";

export const program = new Program<MultiWallet>(MultiWalletIdl as MultiWallet, {
  connection: new Connection(RPC_ENDPOINT),
});
