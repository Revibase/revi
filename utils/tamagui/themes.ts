import * as Colors from "@tamagui/colors";
import { createThemes } from "@tamagui/theme-builder";
import { SimpleThemesDefinition } from "@tamagui/theme-builder/types/createThemes";

const darkPalette = [
  "#050505",
  "#151515",
  "#191919",
  "#232323",
  "#282828",
  "#323232",
  "#424242",
  "#494949",
  "#545454",
  "#626262",
  "#a5a5a5",
  "#fff",
];

const lightPalette = [
  "#fff",
  "#f8f8f8",
  "hsl(0, 0%, 96.3%)",
  "hsl(0, 0%, 94.1%)",
  "hsl(0, 0%, 92.0%)",
  "hsl(0, 0%, 90.0%)",
  "hsl(0, 0%, 88.5%)",
  "hsl(0, 0%, 81.0%)",
  "hsl(0, 0%, 56.1%)",
  "hsl(0, 0%, 50.3%)",
  "hsl(0, 0%, 42.5%)",
  "hsl(0, 0%, 9.0%)",
];

const lightShadows = {
  shadow1: "rgba(0,0,0,0.04)",
  shadow2: "rgba(0,0,0,0.08)",
  shadow3: "rgba(0,0,0,0.16)",
  shadow4: "rgba(0,0,0,0.24)",
  shadow5: "rgba(0,0,0,0.32)",
  shadow6: "rgba(0,0,0,0.4)",
};

const darkShadows = {
  shadow1: "rgba(0,0,0,0.2)",
  shadow2: "rgba(0,0,0,0.3)",
  shadow3: "rgba(0,0,0,0.4)",
  shadow4: "rgba(0,0,0,0.5)",
  shadow5: "rgba(0,0,0,0.6)",
  shadow6: "rgba(0,0,0,0.7)",
};

const blackColors = {
  black1: darkPalette[0],
  black2: darkPalette[1],
  black3: darkPalette[2],
  black4: darkPalette[3],
  black5: darkPalette[4],
  black6: darkPalette[5],
  black7: darkPalette[6],
  black8: darkPalette[7],
  black9: darkPalette[8],
  black10: darkPalette[9],
  black11: darkPalette[10],
  black12: darkPalette[11],
};

const whiteColors = {
  white1: lightPalette[0],
  white2: lightPalette[1],
  white3: lightPalette[2],
  white4: lightPalette[3],
  white5: lightPalette[4],
  white6: lightPalette[5],
  white7: lightPalette[6],
  white8: lightPalette[7],
  white9: lightPalette[8],
  white10: lightPalette[9],
  white11: lightPalette[10],
  white12: lightPalette[11],
};

export const themes = createThemes({
  componentThemes: {
    Tabs: { template: "surface3" },
    TabsList: { template: "surface3" },
    SelectTrigger: { template: "surface1" },
    Card: { template: "surface1" },
    Button: { template: "surface1" },
    Sheet: { template: "surface3" },
    ListItem: { template: "surface2" },
    SheetHandle: { template: "surface2" },
    Checkbox: { template: "surface1" },
    Switch: { template: "surface2" },
    SwitchThumb: { template: "inverse" },
    TooltipContent: { template: "surface2" },
    Progress: { template: "surface1" },
    RadioGroupItem: { template: "surface2" },
    TooltipArrow: { template: "surface1" },
    SliderTrackActive: { template: "surface3" },
    SliderTrack: { template: "surface1" },
    SliderThumb: { template: "inverse" },
    Tooltip: { template: "inverse" },
    ProgressIndicator: { template: "inverse" },
    Input: { template: "surface1" },
    TextArea: { template: "surface1" },
  } satisfies SimpleThemesDefinition,

  base: {
    palette: {
      dark: darkPalette,
      light: lightPalette,
    },

    // for values we don't want being inherited onto sub-themes
    extra: {
      light: {
        ...Colors.blue,
        ...Colors.green,
        ...Colors.red,
        ...Colors.yellow,
        ...lightShadows,
        ...blackColors,
        ...whiteColors,
        shadowColor: lightShadows.shadow1,
      },
      dark: {
        ...Colors.blueDark,
        ...Colors.greenDark,
        ...Colors.redDark,
        ...Colors.yellowDark,
        ...darkShadows,
        ...blackColors,
        ...whiteColors,
        shadowColor: darkShadows.shadow1,
      },
    },
  },

  // inverse accent theme
  accent: {
    palette: {
      dark: lightPalette,
      light: darkPalette,
    },
  },

  childrenThemes: {
    black: {
      palette: {
        dark: Object.values(blackColors),
        light: Object.values(blackColors),
      },
    },
    white: {
      palette: {
        dark: Object.values(whiteColors),
        light: Object.values(whiteColors),
      },
    },

    blue: {
      palette: {
        dark: Object.values(Colors.blueDark),
        light: Object.values(Colors.blue),
      },
    },
    red: {
      palette: {
        dark: Object.values(Colors.redDark),
        light: Object.values(Colors.red),
      },
    },
    yellow: {
      palette: {
        dark: Object.values(Colors.yellowDark),
        light: Object.values(Colors.yellow),
      },
    },
    green: {
      palette: {
        dark: Object.values(Colors.greenDark),
        light: Object.values(Colors.green),
      },
    },
  },
});

export type Themes = typeof themes;
