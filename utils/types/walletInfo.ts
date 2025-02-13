import { Permissions } from "@revibase/multi-wallet";

export interface WalletInfo {
  createKey: string;
  threshold: number;
  members: { permissions: Permissions | null; pubkey: string }[];
  metadata: string | null;
  fullMetadata: string | undefined;
}
