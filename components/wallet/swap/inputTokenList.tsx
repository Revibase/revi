import { getVaultFromAddress } from "@revibase/multi-wallet";
import { PublicKey } from "@solana/web3.js";
import { Search } from "@tamagui/lucide-icons";
import { CustomListItem } from "components/ui/CustomListItem";
import { Image } from "expo-image";
import { FC, useMemo, useState } from "react";
import { Avatar, Input, XStack, YStack } from "tamagui";
import {
  proxify,
  SOL_NATIVE_MINT,
  useGetAssetsByOwner,
  useGlobalStore,
  WalletType,
} from "utils";

export const InputTokenList: FC = () => {
  const { walletSheetArgs, setGenericSheetArgs, setAsset } = useGlobalStore();
  const { type, walletAddress } = walletSheetArgs ?? {};

  const { data: allAssets } = useGetAssetsByOwner({
    address:
      type === WalletType.MULTIWALLET && walletAddress
        ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
        : walletAddress,
  });
  const [searchText, setSearchText] = useState("");
  const filteredTokenList = useMemo(() => {
    return (
      allAssets?.items
        .filter(
          (x) =>
            x.interface === "FungibleToken" || x.interface === "FungibleAsset"
        )
        .concat([SOL_NATIVE_MINT(allAssets.nativeBalance)])
        .filter((x) => {
          if (!searchText) return true;
          return (
            x.content?.metadata.name
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            x.content?.metadata.symbol
              .toLowerCase()
              .includes(searchText.toLowerCase())
          );
        }) || []
    );
  }, [allAssets, searchText]);

  return (
    <YStack items="center" gap={"$4"} flex={1}>
      <XStack
        items="center"
        borderWidth={1}
        borderTopLeftRadius={"$4"}
        borderTopRightRadius={"$4"}
        borderBottomLeftRadius={"$4"}
        borderBottomRightRadius={"$4"}
        p={"$2"}
        borderColor={"$borderColor"}
      >
        <Input
          size={"$3"}
          value={searchText}
          onChangeText={setSearchText}
          bg={"$colorTransparent"}
          borderWidth={"$0"}
          flex={1}
          placeholder={`Seach`}
        />
        <Search mr={"$2"} />
      </XStack>
      <YStack width={"100%"} gap="$1.5">
        {filteredTokenList.map((x) => {
          return (
            <CustomListItem
              key={x.id}
              bordered
              width={"100%"}
              borderTopLeftRadius={"$4"}
              borderTopRightRadius={"$4"}
              borderBottomLeftRadius={"$4"}
              borderBottomRightRadius={"$4"}
              onPress={() => {
                setAsset(x);
                setGenericSheetArgs(null);
              }}
              icon={
                <Avatar size="$4" circular>
                  {x.content?.links?.image && (
                    <Image
                      style={{ height: "100%", width: "100%" }}
                      source={{
                        uri: proxify(x.content?.links?.image),
                      }}
                    />
                  )}
                </Avatar>
              }
              title={x.content?.metadata.name}
              subTitle={`${
                (x.token_info?.balance || 0) /
                10 ** (x.token_info?.decimals || 0)
              } ${x.content?.metadata.symbol}`}
            />
          );
        })}
      </YStack>
    </YStack>
  );
};
