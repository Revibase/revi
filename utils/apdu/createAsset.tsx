import { ASSET_IDENTIFIER } from "../consts";
import { Chain } from "../types/chain";

// POLICY_ALLOW_READ
export const createAsset = (blockchain: Chain, assetId: number[]) => {
  const payload = [
    0x11,
    0x09,
    0x08,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x20,
    0x00,
    0x00,
    0x41,
    0x04,
    ...ASSET_IDENTIFIER,
    0x43,
    0x02,
    0x00,
    [blockchain.name].concat(assetId).length,
    0x44,
    [blockchain.name].concat(assetId).length,
    ...[blockchain.name].concat(assetId),
  ];

  return [0x80, 0x01, 0x06, 0x00, payload.length, ...payload];
};
