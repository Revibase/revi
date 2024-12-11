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
import { useOnboarding } from "components/providers/onboardingProvider";
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
import { Page } from "utils/enums/wallet";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import { useSetOwnerMutation } from "utils/mutations/setOwner";
import { SignerType } from "utils/program/transactionBuilder";
import { useGetAsset } from "utils/queries/useGetAsset";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";
import { SignerState, TransactionArgs } from "utils/types/transaction";
enum Tab {
  Tokens = "Tokens",
  Collectibles = "Collectibles",
}
export const Main: FC<{
  mint: PublicKey | undefined;
  walletAddress: PublicKey | undefined;
  allAssets: DAS.GetAssetResponseList | null | undefined;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setViewAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
  close: () => void;
  isMultiSig?: boolean;
}> = ({
  walletAddress,
  mint,
  allAssets,
  setPage,
  setViewAsset,
  setArgs,
  close,
  isMultiSig = true,
}) => {
  const toast = useToastController();
  const { deviceAddress, cloudAddress } = useOnboarding();
  const copyToClipboard = async (textToCopy: string) => {
    await Clipboard.setStringAsync(textToCopy);
    toast.show(`${textToCopy.substring(0, 12)}... Copied!`);
  };
  const [tab, setTab] = useState(Tab.Tokens);
  const { data: walletInfo } = useGetWalletInfo({
    address:
      walletAddress && isMultiSig
        ? getMultiSigFromAddress(walletAddress)
        : null,
  });
  const setOwnerMutation = useSetOwnerMutation({
    wallet: walletAddress,
  });

  const owner = useMemo(() => {
    if (!isMultiSig || !walletAddress || !walletInfo) return null;

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
                const feePayer = {
                  key: deviceAddress,
                  type: SignerType.DEVICE,
                  state: SignerState.Unsigned,
                };
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
                const ix = await setOwnerMutation.mutateAsync({
                  newOwners: null,
                  signers,
                  feePayer,
                });
                if (ix) {
                  setArgs({
                    feePayer,
                    signers,
                    ixs: [ix],
                  });
                  setPage(Page.Confirmation);
                }
              } else {
                close();
                router.replace("/(tabs)/profile");
              }
            },
            label: "Revoke",
          }
        : {
            address: owners[0].toString(),
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
          const feePayer = {
            key: walletAddress,
            type: SignerType.NFC,
            state: SignerState.Unsigned,
          };
          const ix = await setOwnerMutation.mutateAsync({
            newOwners: [deviceAddress, cloudAddress],
            feePayer,
          });
          if (ix) {
            setArgs({
              feePayer,
              signers: [feePayer],
              ixs: [ix],
            });
            setPage(Page.Confirmation);
          }
        } else {
          close();
          router.replace("/(tabs)/profile");
        }
      },
      label: "Request",
    };
  }, [close, walletAddress, deviceAddress, cloudAddress, walletInfo]);
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
              <Text>{`Signatures Threshold: ${walletInfo?.threshold}`}</Text>
              {walletAddress && (
                <ListItem
                  bordered
                  borderRadius={"$4"}
                  onPress={() =>
                    copyToClipboard(
                      getVaultFromAddress({ address: walletAddress }).toString()
                    )
                  }
                  hoverTheme
                  pressTheme
                  title={getVaultFromAddress({
                    address: walletAddress,
                  }).toString()}
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
          disabled={setOwnerMutation.isPending}
          size={"$3"}
          onPress={owner?.action}
          theme={"active"}
        >
          <ButtonText>{owner?.label}</ButtonText>
          {setOwnerMutation.isPending && <Spinner />}
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
          allAssets={allAssets}
          setPage={setPage}
          setViewAsset={setViewAsset}
        />
      )}
      {tab == Tab.Collectibles && (
        <CollectiblesPage
          allAssets={allAssets}
          setViewAsset={setViewAsset}
          setPage={setPage}
        />
      )}
    </YStack>
  );
};

const TokenPage: FC<{
  mint: PublicKey | undefined;
  allAssets: DAS.GetAssetResponseList | null | undefined;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setViewAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;
}> = ({ mint, allAssets, setPage, setViewAsset }) => {
  const asset = useMemo(
    () => allAssets?.items.find((x) => x.id === mint?.toString()),
    [allAssets, mint]
  );
  const { data: mintData } = useGetAsset({ mint });

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
                theme={"red"}
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
            theme={"active"}
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
            theme={"active"}
            circular
          >
            <ButtonIcon
              children={<ArrowUpRight size={"$2"} color={"$accentColor"} />}
            />
          </Button>
          <Text>Withdraw</Text>
        </YStack>
      </XStack>

      <YStack width={"100%"}>
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
                  <YStack>
                    <Text>
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
  allAssets: DAS.GetAssetResponseList | null | undefined;
  setViewAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
}> = ({ allAssets, setViewAsset, setPage }) => {
  return (
    <YStack
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
