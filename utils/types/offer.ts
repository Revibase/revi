import { Timestamp } from "@react-native-firebase/firestore";
import { Permissions } from "@revibase/multi-wallet";

export interface Offer {
  createKey: string;
  identifier: number;
  isPending: boolean;
  isRejected: boolean;
  recipient: string | null;
  approver: string | null;
  mint: string | null;
  amount: number;
  proposer: string;
  newMembers: { pubkey: string; permissions: Permissions | null }[];
  threshold: number;
  updatedAt: Timestamp;
  isEscrowClosed: boolean;
  txSig: string;
}
