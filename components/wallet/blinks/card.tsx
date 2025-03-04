import { Blink } from "@dialectlabs/blinks-react-native";
import { CustomListItem } from "components/CustomListItem";
import { useGetBlinksAdapter } from "components/hooks";
import { FC, useMemo } from "react";
import Markdown from "react-native-markdown-display";
import { Text, useTheme, YGroup, YStack } from "tamagui";
import { Page, useGetAssetMetadata, useGlobalStore } from "utils";
import { ScreenWrapper } from "../screenWrapper";

type DataRow = {
  key: string;
  title: string;
  value: string;
  icon?: string;
  url?: string;
};
type BlinkData = {
  rows: DataRow[];
  extendedDescription: string;
};
export const BlinksCard: FC = () => {
  const { setPage, walletSheetArgs, setBlink } = useGlobalStore();
  const { blink, callback } = walletSheetArgs ?? {};
  const adapter = useGetBlinksAdapter();
  const { background, background06, borderColor, color, color10 } = useTheme();
  const actionUrl = useMemo(() => {
    if (!blink) return null;
    try {
      return new URL(blink.url);
    } catch (e) {
      return null;
    }
  }, [blink?.url]);

  const { data } = useGetAssetMetadata({
    url: actionUrl
      ? actionUrl.origin + actionUrl.pathname + "/metadata"
      : undefined,
  });
  const blinkMetadata = data as BlinkData | null | undefined;

  if (!blink || !actionUrl) {
    return null;
  }

  return (
    <ScreenWrapper
      text={actionUrl.hostname}
      reset={() => {
<<<<<<< Updated upstream
        setBlink(undefined);
        setPage(Page.BlinksPage);
=======
        if (callback) {
          callback();
          setBlink(undefined);
        } else {
          setPage(Page.Asset);
          setBlink(undefined);
        }
>>>>>>> Stashed changes
      }}
    >
      <YStack gap={"$4"}>
        {blinkMetadata?.extendedDescription && (
          <Markdown
            style={{
              heading1: {
                fontSize: 20,
                fontWeight: "bold",
              },
              heading2: {
                fontSize: 18,
                fontWeight: "bold",
              },
              heading3: {
                fontSize: 16,
                fontWeight: "bold",
              },
              body: {
                fontSize: 16,
                color: color.val,
              },
            }}
          >
            {blinkMetadata.extendedDescription}
          </Markdown>
        )}
        {blinkMetadata?.rows && (
          <YGroup bordered>
            {blinkMetadata.rows.map((x) => (
              <YGroup.Item key={x.key}>
                <CustomListItem
                  bordered
                  title={x.title}
                  iconAfter={<Text>{x.value}</Text>}
                />
              </YGroup.Item>
            ))}
          </YGroup>
        )}
        <Blink
          theme={{
            "--blink-bg-primary": background.val,
            "--blink-stroke-primary": borderColor.val,
            "--blink-input-bg": background06.val,
            "--blink-text-link": color10.val,
            "--blink-text-input": color.val,
            "--blink-text-primary": color.val,
            "--blink-text-secondary": color.val,
          }}
          adapter={adapter}
          action={blink}
          websiteUrl={actionUrl.href}
          websiteText={actionUrl.hostname}
        />
      </YStack>
    </ScreenWrapper>
  );
};
