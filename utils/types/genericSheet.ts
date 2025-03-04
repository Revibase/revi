import { ThemeName } from "tamagui";

export interface GenericSheetArgs {
  title: string;
  body: React.ReactNode;
  theme: ThemeName;
  snapPoints: number[];
}
