import { Action } from "@dialectlabs/blinks-react-native";
import { Chain } from "@revibase/nfc-core/dist/types";
import { DAS } from "@revibase/token-transfer";
import { ThemeName } from "tamagui";
import { Page, WalletType } from "../enums";
import { Offer } from "./offer";

export interface WalletSheetArgs {
  walletAddress: string;
  mint: string | null | undefined;
  type: WalletType;
  callback?: (txSig?: string) => void;
  page?: Page;
  offer?: Offer | null;
  asset?: DAS.GetAssetResponse | null;
  swapAsset?: DAS.GetAssetResponse | null;
  blink?: Action | null;
  blockchain?: Chain | null;
  theme?: ThemeName | null;
  pendingOffersCheck?: boolean;
  noOwnersCheck?: boolean;
}
