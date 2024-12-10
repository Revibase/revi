import {BLOCKCHAIN} from '../enums/chain';

export interface Chain {
  identifier: number[];
  curve: number;
  name: BLOCKCHAIN;
}
