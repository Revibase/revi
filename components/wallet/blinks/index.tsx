import { useAction } from "@dialectlabs/blinks-react-native";
import { collection, query } from "@react-native-firebase/firestore";
import { Image } from "expo-image";
import { FC, useMemo, useState } from "react";
import { Heading, Text, useTheme, YStack } from "tamagui";
import { db, Page, proxify, useGetAssetMetadata, useGlobalStore } from "utils";
import { useFirestoreCollection } from "utils/queries/useFirestoreCollection";

export const BlinksPage: FC = () => {
  const { walletSheetArgs } = useGlobalStore();
  const { asset } = walletSheetArgs ?? {};
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
  const listOfBlinks = useMemo(
    () =>
      (
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
      }),
    [data, fallback]
  );

  if ((!assetLoading && !fallbackLoading) || listOfBlinks.length == 0) {
    return null;
  }

  return (
    <>
      <Heading size={"$5"}>{"Blinks"}</Heading>
      <YStack width={"100%"} gap={"$4"} items="center">
        {listOfBlinks.map((blink, index) => (
          <BlinksListItem key={index} url={blink} />
        ))}
      </YStack>
    </>
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
