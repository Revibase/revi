import { Program } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { BLOCKCHAIN } from "./enums/chain";
import MultiWalletIdl from "./program/idl/multi_wallet.json";
import { MultiWallet } from "./program/types/multi_wallet";
import { Chain } from "./types/chain";

export const ASSET_IDENTIFIER = [0x00, 0x00, 0x01, 0x00];

export const AUTHENTICATION_ID = [0x7f, 0xff, 0x02, 0x01];

export const ATTESTATION_KEY = [0xf0, 0x00, 0x00, 0x12];

export const AID = [
  0xa0, 0x00, 0x00, 0x03, 0x96, 0x54, 0x53, 0x00, 0x00, 0x00, 0x01, 0x03, 0x00,
  0x00, 0x00, 0x00,
];

export const CHAIN: Record<string, Chain> = {
  SOLANA: {
    identifier: [0x00, 0x00, 0x01, 0x01],
    curve: 0x40,
    name: BLOCKCHAIN.SOLANA,
  },
};

export const RPC_ENDPOINT = "https://rpc.blinksfeed.com";

export const program = new Program<MultiWallet>(MultiWalletIdl as MultiWallet, {
  connection: new Connection(RPC_ENDPOINT),
});
