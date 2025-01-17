import { Timestamp } from "@react-native-firebase/firestore";

export interface Offer {
  createKey: string;
  identifier: number;
  isPending: boolean;
  isRejected: boolean;
  recipient: string | null;
  approver: string | null;
  mint: string;
  amount: number;
  proposer: string;
  newMembers: { pubkey: string; label: number | null }[];
  threshold: number;
  updatedAt: Timestamp;
  isEscrowClosed: boolean;
  txSig: string;
}
