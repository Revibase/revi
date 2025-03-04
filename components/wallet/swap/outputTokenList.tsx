import { getVaultFromAddress } from "@revibase/multi-wallet";
import { PublicKey } from "@solana/web3.js";
import { Search } from "@tamagui/lucide-icons";
import { useConnection } from "components/providers/connectionProvider";
import { CustomListItem } from "components/ui/CustomListItem";
import { Image } from "expo-image";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Input, Spinner, Text, XStack, YStack } from "tamagui";
import {
  debounce,
  getAsset,
  proxify,
  Token,
  useGetAssetsByOwner,
  useGlobalStore,
  WalletType,
} from "utils";
import { typesenseClient } from "utils/typesense";

export const OutputTokenList: FC = () => {
  const { walletSheetArgs, setGenericSheetArgs, setSwapAsset } =
    useGlobalStore();
  const { type, walletAddress } = walletSheetArgs ?? {};
  const { connection } = useConnection();
  const { data: allAssets } = useGetAssetsByOwner({
    address:
      type === WalletType.MULTIWALLET && walletAddress
        ? getVaultFromAddress(new PublicKey(walletAddress)).toString()
        : walletAddress,
  });
  const [searchText, setSearchText] = useState("");
  const [filteredTokenList, setFilteredTokenList] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef<number>(0);
  const fetchTokens = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const currentRequestId = ++requestIdRef.current;
      const result = await typesenseClient
        .collections("tokens")
        .documents()
        .search({
          q: !query.trim() ? "*" : query.trim(),
          query_by: "name,address,symbol",
          limit: 5,
        });
      if (currentRequestId === requestIdRef.current) {
        setFilteredTokenList(
          result.hits?.map((hit: any) => hit.document) || []
        );
      }
    } catch (error) {
      console.error("Typesense Search Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useMemo(
    () => debounce(fetchTokens, 300),
    [fetchTokens]
  );

  useEffect(() => {
    debouncedSearch(searchText);

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchText, debouncedSearch]);

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
          placeholder="Search"
          autoCapitalize={"none"}
        />
        <Search mr={"$2"} />
      </XStack>

      <YStack width={"100%"} gap="$1.5">
        {loading && filteredTokenList.length === 0 && <Spinner size="large" />}
        {!loading && filteredTokenList.length === 0 && searchText && (
          <Text items={"center"} fontSize="$6" fontWeight={600}>
            {"No Results Found."}
          </Text>
        )}
        {filteredTokenList.map((x) => (
          <CustomListItem
            key={x.id}
            bordered
            width={"100%"}
            borderTopLeftRadius={"$4"}
            borderTopRightRadius={"$4"}
            borderBottomLeftRadius={"$4"}
            borderBottomRightRadius={"$4"}
            onPress={async () => {
              const token =
                allAssets?.items.find((y) => y.id === x.id) ||
                (await getAsset(x.address, connection));
              setSwapAsset(token);
              setGenericSheetArgs(null);
            }}
            icon={
              x.logoURI ? (
                <Avatar size="$4" circular>
                  <Image
                    style={{ height: "100%", width: "100%" }}
                    source={{ uri: proxify(x.logoURI) }}
                  />
                </Avatar>
              ) : null
            }
            title={x.name}
            subTitle={`${
              (allAssets?.items.find((y) => y.id === x.id)?.token_info
                ?.balance || 0) /
              10 **
                (allAssets?.items.find((y) => y.id === x.id)?.token_info
                  ?.decimals || 0)
            } ${x.symbol}`}
          />
        ))}
      </YStack>
    </YStack>
  );
};
