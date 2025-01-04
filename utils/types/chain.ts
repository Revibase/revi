import { BLOCKCHAIN } from "../enums/chain";

export interface Chain {
  chainId: number[];
  curve: number;
  name: BLOCKCHAIN;
  assetId?: number[];
}
