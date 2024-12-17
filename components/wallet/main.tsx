import { PublicKey } from "@solana/web3.js";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUpRight,
  Copy,
  Menu,
  User,
  Wallet,
  X,
} from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { useGlobalVariables } from "components/providers/globalProvider";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { FC, useMemo, useState } from "react";
import { Pressable } from "react-native";
import {
  Avatar,
  AvatarImage,
  Button,
  ButtonIcon,
  ButtonText,
  Dialog,
  Heading,
  Image,
  ListItem,
  Spinner,
  Text,
  Unspaced,
  XStack,
  YGroup,
  YStack,
} from "tamagui";
import { SOL_NATIVE_MINT } from "utils/consts";
import { SignerType } from "utils/enums/transaction";
import { Page } from "utils/enums/wallet";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import { useCreateVaultExecuteIxMutation } from "utils/mutations/createVaultExecuteIx";
import { useSetOwnerIxMutation } from "utils/mutations/setOwnerIx";
import { useGetAsset } from "utils/queries/useGetAsset";
import { useGetAssetsByOwner } from "utils/queries/useGetAssetsByOwner";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";
import { SignerState, TransactionArgs } from "utils/types/transaction";
enum Tab {
  Tokens = "Tokens",
  Collectibles = "Collectibles",
}
export const Main: FC<{
  mint: PublicKey | undefined;
  walletAddress: PublicKey;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setViewAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
  close: () => void;
}> = ({ walletAddress, mint, setPage, setViewAsset, setArgs, close }) => {
  const [tab, setTab] = useState(Tab.Tokens);
  const toast = useToastController();
  const copyToClipboard = async (textToCopy: string) => {
    await Clipboard.setStringAsync(textToCopy);
    toast.show(`${textToCopy.substring(0, 12)}... Copied!`);
  };

  const { deviceAddress, cloudAddress } = useGlobalVariables();
  const { data: walletInfo } = useGetWalletInfo({
    address: getMultiSigFromAddress(walletAddress),
  });

  const setOwnerIxMutation = useSetOwnerIxMutation({
    wallet: walletAddress,
  });

  const createVaultExecuteIxMutation = useCreateVaultExecuteIxMutation({
    wallet: walletAddress,
  });

  const owner = useMemo(() => {
    if (!walletInfo) return null;

    const owners = walletInfo.members.filter(
      (x) => x.toString() !== walletAddress.toString()
    );
    if (owners.length > 0) {
      const owner = owners.find(
        (x) => deviceAddress && x.toString() == deviceAddress.toString()
      );
      return owner
        ? {
            address: "You are the owner.",
            action: async () => {
              if (deviceAddress && cloudAddress) {
                const signers = [
                  {
                    key: deviceAddress,
                    type: SignerType.DEVICE,
                    state: SignerState.Unsigned,
                  },
                  {
                    key: cloudAddress,
                    type: SignerType.CLOUD,
                    state: SignerState.Unsigned,
                  },
                ];
                const ixs = await setOwnerIxMutation.mutateAsync({
                  newOwners: null,
                  signers,
                });

                if (ixs) {
                  const result = await createVaultExecuteIxMutation.mutateAsync(
                    {
                      signers,
                      ixs,
                    }
                  );
                  if (result) {
                    setArgs({
                      signers,
                      ixs: [result.vaultTransactionExecuteIx],
                      lookUpTables: result.lookupTableAccounts,
                      microLamports: result.microLamports,
                      units: result.units,
                      totalFees: result.totalFees,
                    });
                    setPage(Page.Confirmation);
                  }
                }
              } else {
                close();
                router.replace("/(tabs)/profile");
              }
            },
            label: "Revoke",
          }
        : {
            address: owners[1].toString(),
            action: async () => {
              //send notification to owner
            },
            label: "Request",
          };
    }
    return {
      address: "No Owner",
      action: async () => {
        if (deviceAddress && cloudAddress) {
          const signers = [
            {
              key: walletAddress,
              type: SignerType.NFC,
              state: SignerState.Unsigned,
            },
          ];
          const newOwners = [
            {
              key: deviceAddress,
              type: SignerType.DEVICE,
              state: SignerState.Unsigned,
            },
            {
              key: cloudAddress,
              type: SignerType.CLOUD,
              state: SignerState.Unsigned,
            },
          ];
          const ixs = await setOwnerIxMutation.mutateAsync({
            newOwners,
            signers,
          });

          if (ixs) {
            const result = await createVaultExecuteIxMutation.mutateAsync({
              signers,
              ixs,
            });
            if (result) {
              setArgs({
                signers,
                ixs: [result.vaultTransactionExecuteIx],
                lookUpTables: result.lookupTableAccounts,
                microLamports: result.microLamports,
                units: result.units,
                totalFees: result.totalFees,
              });
              setPage(Page.Confirmation);
            }
          }
        } else {
          close();
          router.replace("/(tabs)/profile");
        }
      },
      label: "Request",
    };
  }, [close, walletAddress, deviceAddress, walletInfo]);
  return (
    <YStack alignItems="center" gap="$4">
      <XStack
        width={"100%"}
        alignItems="center"
        justifyContent="space-between"
        padding={"$2"}
        gap={"$4"}
        borderWidth={"$0.75"}
        borderColor={"$gray10Dark"}
        borderRadius={"$4"}
      >
        <Dialog modal>
          <Dialog.Trigger asChild>
            <XStack alignItems="center" gap="$4">
              <Menu />
              <Text maxWidth={"200"} numberOfLines={1} textAlign="left">
                {owner?.address || walletAddress?.toString()}
              </Text>
            </XStack>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay
              key="overlay"
              animation="slow"
              opacity={0.5}
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
            <Dialog.Content
              width={"80%"}
              gap="$4"
              borderWidth={1}
              borderColor="$borderColor"
              enterStyle={{ y: -10, opacity: 0 }}
              exitStyle={{ y: -10, opacity: 0 }}
              elevate
              animation={[
                "quick",
                {
                  opacity: {
                    overshootClamping: true,
                  },
                },
              ]}
            >
              <Heading>Multisig Details</Heading>
              {walletInfo?.label && (
                <Text numberOfLines={1}>{`Label: ${walletInfo?.label}`}</Text>
              )}
              <Text>{`Signatures Threshold: ${walletInfo?.threshold}`}</Text>
              {walletAddress && (
                <ListItem
                  bordered
                  borderRadius={"$4"}
                  onPress={() =>
                    copyToClipboard(
                      getVaultFromAddress(walletAddress).toString()
                    )
                  }
                  hoverTheme
                  pressTheme
                  title={getVaultFromAddress(walletAddress).toString()}
                  subTitle="Multisig Vault Address"
                  icon={Wallet}
                  iconAfter={Copy}
                />
              )}
              <Unspaced>
                <Dialog.Close asChild>
                  <Button
                    position="absolute"
                    top="$4"
                    right="$4"
                    size="$2"
                    circular
                    icon={X}
                  />
                </Dialog.Close>
              </Unspaced>
              <Text>Members: </Text>
              <YGroup alignSelf="center" bordered size="$5">
                {walletInfo?.members.map((member, index) => {
                  return (
                    <YGroup.Item key={member.toString()}>
                      <ListItem
                        onPress={() => copyToClipboard(member.toString())}
                        hoverTheme
                        pressTheme
                        title={member.toString()}
                        subTitle={`Member ${index + 1} ${
                          member.toString() === walletInfo.createKey.toString()
                            ? " (Creator)"
                            : ""
                        }`}
                        icon={User}
                        iconAfter={Copy}
                      />
                    </YGroup.Item>
                  );
                })}
              </YGroup>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
        <Button
          disabled={
            setOwnerIxMutation.isPending ||
            createVaultExecuteIxMutation.isPending
          }
          size={"$3"}
          onPress={owner?.action}
        >
          <ButtonText>{owner?.label}</ButtonText>
          {(setOwnerIxMutation.isPending ||
            createVaultExecuteIxMutation.isPending) && <Spinner />}
        </Button>
      </XStack>

      <XStack gap="$4">
        {Object.entries(Tab).map((x) => (
          <Button
            backgroundColor={
              tab == x[1] ? "$accentBackground" : "$colorTransparent"
            }
            onPress={() => setTab(x[1])}
            key={x[0]}
            size={"$3"}
          >
            <ButtonText>{x[1]}</ButtonText>
          </Button>
        ))}
      </XStack>

      {tab == Tab.Tokens && (
        <TokenPage
          mint={mint}
          walletAddress={walletAddress}
          walletInfo={walletInfo}
          setPage={setPage}
          setViewAsset={setViewAsset}
        />
      )}
      {tab == Tab.Collectibles && (
        <CollectiblesPage
          walletAddress={walletAddress}
          walletInfo={walletInfo}
          setViewAsset={setViewAsset}
          setPage={setPage}
        />
      )}
    </YStack>
  );
};

const TokenPage: FC<{
  mint: PublicKey | undefined;
  walletInfo: any | null;
  walletAddress: PublicKey;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setViewAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;
}> = ({ walletAddress, walletInfo, mint, setPage, setViewAsset }) => {
  const { data: allAssets } = useGetAssetsByOwner({
    address: walletInfo ? getVaultFromAddress(walletAddress) : walletAddress,
  });

  const asset = useMemo(
    () => allAssets?.items.find((x) => x.id === mint?.toString()),
    [allAssets, mint]
  );
  const { data: mintData } = useGetAsset({ mint });
  const nativeAsset = SOL_NATIVE_MINT(allAssets?.nativeBalance);
  return (
    <>
      {mintData && (
        <YStack alignItems="center" gap="$1">
          <Pressable
            onPress={() => {
              if (asset) {
                setViewAsset(asset);
                setPage(Page.Asset);
              }
            }}
          >
            <Avatar size={"$20"} borderRadius={"$4"}>
              <AvatarImage
                source={{
                  uri: mintData.content?.links?.image,
                }}
              />
            </Avatar>
          </Pressable>
          {!asset && (
            <XStack alignItems="center" gap="$2">
              <AlertTriangle size={"$1"} color={"red"} />
              <Text
                color={"red"}
              >{`${mintData.content?.metadata.name} not found.`}</Text>
            </XStack>
          )}
        </YStack>
      )}

      <XStack alignItems="center" gap="$6">
        <YStack gap="$2" alignItems="center" justifyContent="center">
          <Button
            circular
            onPress={() => {
              setPage(Page.Deposit);
            }}
          >
            <ButtonIcon
              children={<ArrowDown size={"$2"} color={"$accentColor"} />}
            />
          </Button>
          <Text>Deposit</Text>
        </YStack>
        <YStack gap="$2" alignItems="center" justifyContent="center">
          <Button
            onPress={() => {
              setPage(Page.Search);
            }}
            circular
          >
            <ButtonIcon
              children={<ArrowUpRight size={"$2"} color={"$accentColor"} />}
            />
          </Button>
          <Text>Withdraw</Text>
        </YStack>
      </XStack>

      <YStack width={"100%"} gap="$2">
        <ListItem
          padded
          bordered
          width={"100%"}
          borderRadius={"$4"}
          onPress={() => {
            setViewAsset(nativeAsset);
            setPage(Page.Asset);
          }}
          icon={
            <Avatar size="$4" circular>
              <AvatarImage
                source={{
                  uri: nativeAsset.content?.links?.image,
                }}
              />
            </Avatar>
          }
          title={nativeAsset.content?.metadata.name}
          subTitle={`${
            (nativeAsset.token_info?.balance || 0) /
            10 ** (nativeAsset.token_info?.decimals || 0)
          } ${nativeAsset.content?.metadata.symbol}`}
          iconAfter={
            <YStack maxWidth={"25%"}>
              <Text numberOfLines={1}>
                {`$${
                  (nativeAsset.token_info?.price_info?.price_per_token || 0) *
                  ((nativeAsset.token_info?.balance || 0) /
                    10 ** (nativeAsset.token_info?.decimals || 0))
                }`}
              </Text>
            </YStack>
          }
        />

        {allAssets?.items
          .filter(
            (x) =>
              x.interface == "FungibleToken" || x.interface == "FungibleAsset"
          )
          .map((x) => {
            return (
              <ListItem
                key={x.id}
                padded
                bordered
                width={"100%"}
                borderRadius={"$4"}
                onPress={() => {
                  setViewAsset(x);
                  setPage(Page.Asset);
                }}
                icon={
                  <Avatar size="$4" circular>
                    <AvatarImage
                      source={{
                        uri: x.content?.links?.image,
                      }}
                    />
                  </Avatar>
                }
                title={x.content?.metadata.name}
                subTitle={`${
                  (x.token_info?.balance || 0) /
                  10 ** (x.token_info?.decimals || 0)
                } ${x.content?.metadata.symbol}`}
                iconAfter={
                  <YStack maxWidth={"25%"}>
                    <Text numberOfLines={1}>
                      {`$${
                        (x.token_info?.price_info?.price_per_token || 0) *
                        ((x.token_info?.balance || 0) /
                          10 ** (x.token_info?.decimals || 0))
                      }`}
                    </Text>
                  </YStack>
                }
              />
            );
          })}
      </YStack>
    </>
  );
};

const CollectiblesPage: FC<{
  walletInfo: any | null;
  walletAddress: PublicKey;
  setViewAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
}> = ({ walletAddress, walletInfo, setViewAsset, setPage }) => {
  const { data: allAssets } = useGetAssetsByOwner({
    address: walletInfo ? getVaultFromAddress(walletAddress) : walletAddress,
  });
  return (
    <YStack
      width={"100%"}
      flexWrap="wrap" // Allow items to wrap within the container
      flexDirection="row" // Make the children flow in rows
      gap="$4" // Spacing between grid items
    >
      {allAssets?.items
        .filter(
          (x) =>
            !(x.interface == "FungibleToken" || x.interface == "FungibleAsset")
        )
        .map((x) => {
          return (
            <Button
              padded={false}
              key={x.id}
              width="50%"
              aspectRatio={1}
              justifyContent="center"
              alignItems="center"
              borderRadius="$4"
              padding={0}
              onPress={() => {
                setViewAsset(x);
                setPage(Page.Asset);
              }}
            >
              <Image
                borderRadius={"$4"}
                height={"100%"}
                width={"100%"}
                objectFit="contain"
                source={{ uri: x?.content?.links?.image }}
                alt="image"
              />
            </Button>
          );
        })}
    </YStack>
  );
};
