export enum SignerType {
  DEVICE = "Device Wallet",
  NFC = "Hardware Wallet",
  CLOUD = "Cloud Wallet",
}

export const SignerTypePriority = {
  [SignerType.DEVICE]: 0,
  [SignerType.NFC]: 1,
  [SignerType.CLOUD]: 2,
};
