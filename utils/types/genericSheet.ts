import { ThemeName } from "tamagui";

export interface GenericSheetArgs {
  title: string;
  body: React.ReactNode;
  actionText: string;
  onPress: () => void;
  theme: ThemeName;
  snapPoints: number[];
}
