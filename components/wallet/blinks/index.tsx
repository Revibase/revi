import { useAction } from "@dialectlabs/blinks-react-native";
import { collection, query } from "@react-native-firebase/firestore";
import { Image } from "expo-image";
import { FC, useState } from "react";
import { Card, Heading, Spinner, Text, useTheme, YStack } from "tamagui";
import { db, Page, proxify, useGetAssetMetadata, useGlobalStore } from "utils";
import { useFirestoreCollection } from "utils/queries/useFirestoreCollection";
import { ScreenWrapper } from "../screenWrapper";

export const BlinksPage: FC = () => {
  const { setPage, walletSheetArgs, setAsset } = useGlobalStore();
  const { asset, callback } = walletSheetArgs ?? {};
  const { data, isLoading: assetLoading } = useGetAssetMetadata({
    url: asset?.content?.json_uri,
  });

  const { data: fallback, isLoading: fallbackLoading } = useFirestoreCollection(
    {
      queryKey: ["collection", `Asset/${asset?.id}/Blinks`],
      query: query(collection(db(), `Asset/${asset?.id}/Blinks`)),
      useQueryOptions: {
        queryKey: ["collection", `Asset/${asset?.id}/Blinks`],
        enabled: !data?.["blinks"] && !!asset?.id,
      },
    }
  );
  const listOfBlinks = (
    (data?.["blinks"] ||
      fallback?.docs
        .map((x) => x.data() as { link: string })
        .map((x) => x.link) ||
      []) as string[]
  ).filter((x) => {
    try {
      new URL(x);
      return true;
    } catch (e) {
      return false;
    }
  });

  return (
    <ScreenWrapper
      text={`${asset?.content?.metadata.name}'s Blinks`}
      reset={() => {
        if (callback) {
          callback();
          setAsset(asset);
        } else {
          setPage(Page.Main);
          setAsset(undefined);
        }
      }}
    >
      <YStack gap={"$4"} items="center" flex={1}>
        <Text
          fontSize={"$5"}
          opacity={listOfBlinks.length > 0 ? 1 : 0.5}
        >{`Blockchain links (aka Blinks) are powerful links that lets you interact with the blockchain instantly, delivering seamless on-chain experiences from anywhere.`}</Text>
        {(assetLoading || fallbackLoading) && (
          <YStack items="center" justify="center" flex={1}>
            <Spinner size="large" />
          </YStack>
        )}
        {!assetLoading &&
          !fallbackLoading &&
          listOfBlinks.map((blink, index) => (
            <BlinksListItem key={index} url={blink} />
          ))}
        {!assetLoading && !fallbackLoading && listOfBlinks.length == 0 && (
          <YStack flex={1} items="center" py={"$12"}>
            <Card
              gap={"$4"}
              width={"90%"}
              items="center"
              justify="center"
              p={"$4"}
              borderWidth={"$1"}
              borderColor={"$borderColor"}
              borderTopLeftRadius={"$4"}
              borderTopRightRadius={"$4"}
              borderBottomLeftRadius={"$4"}
              borderBottomRightRadius={"$4"}
              elevate
            >
              <Card.Header size={"$4"}>
                <Heading size={"$4"}>No Blinks Found.</Heading>
              </Card.Header>

              <Text text="center">
                {`Want to add blinks for your token? Click here to learn more.`}
              </Text>
            </Card>
          </YStack>
        )}
      </YStack>
    </ScreenWrapper>
  );
};

const BlinksListItem: React.FC<{
  url: string;
}> = ({ url }) => {
  const { setBlink, setPage } = useGlobalStore();
  const { action } = useAction({ url });
  const { background } = useTheme();
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  if (!action) {
    return null;
  }

  return (
    <YStack
      width={"100%"}
      elevation={"$4"}
      borderTopLeftRadius={"$4"}
      borderTopRightRadius={"$4"}
      onPress={() => {
        setBlink(action);
        setPage(Page.Blinks);
      }}
    >
      <Image
        style={{
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          width: "100%",
          aspectRatio: aspectRatio ?? 1,
        }}
        onLoad={(e) => {
          const { width, height } = e.source;
          setAspectRatio(width / height);
        }}
        source={{
          uri: proxify(action.icon),
        }}
      />
      <YStack
        width={"100%"}
        p={"$3"}
        justify="center"
        borderBottomLeftRadius={"$4"}
        borderBottomRightRadius={"$4"}
        bg={background}
        gap={"$2"}
      >
        <Text numberOfLines={1} fontSize={"$5"} fontWeight={800}>
          {action.title}
        </Text>
        <Text color={"gray"} fontSize={"$3"} numberOfLines={2}>
          {action.description}
        </Text>
      </YStack>
    </YStack>
  );
};
