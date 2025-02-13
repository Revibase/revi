import { createWallet } from "@revibase/multi-wallet";
import { BLOCKCHAIN } from "@revibase/nfc-core/dist/utils/const";
import { PublicKey } from "@solana/web3.js";
import { Copy, RefreshCcw, Trash2 } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { useCopyToClipboard, useWalletInfo } from "components/hooks";
import { FC, useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import {
  ButtonIcon,
  ButtonText,
  Heading,
  Input,
  ListItem,
  Sheet,
  Text,
  ThemeName,
  useWindowDimensions,
  XStack,
  YGroup,
  YStack,
} from "tamagui";
import {
  getSponsoredFeePayer,
  logError,
  nfcCore,
  Page,
  useGlobalStore,
  WalletType,
} from "utils";
import { Header } from "./header";

export const CreateMultisigPage: FC = () => {
  const {
    setTransactionSheetArgs,
    walletSheetArgs,
    setPage,
    setWalletSheetArgs,
    setPreviousData,
    setIsNfcSheetVisible,
  } = useGlobalStore();
  const { walletAddress, mint, theme, type } = walletSheetArgs ?? {};
  const copyToClipboard = useCopyToClipboard();

  const [step, setStep] = useState(0);
  const [metadata, setMetadata] = useState<string | null | undefined>(mint);

  const { walletInfo, isLoading } = useWalletInfo({ walletAddress, type });

  useEffect(() => {
    if (
      type === WalletType.MULTIWALLET &&
      !isLoading &&
      !!walletInfo?.metadata &&
      walletInfo.metadata !== mint
    ) {
      setStep(3);
    }
  }, [walletInfo, type, isLoading, mint]);

  const handleCreateOrEdit = useCallback(async () => {
    try {
      if (!walletAddress) return;

      const feePayer = getSponsoredFeePayer();
      if (walletInfo) {
        setTransactionSheetArgs({
          feePayer,
          theme,
          walletAddress,
          callback: (signature) =>
            signature && !metadata ? setPage(Page.Main) : setStep(3),
          walletInfo,
          changeConfig: [
            {
              type: "setMetadata",
              metadata: metadata ? new PublicKey(metadata) : null,
            },
          ],
        });
      } else {
        let ixs = await createWallet({
          feePayer: new PublicKey(feePayer),
          walletAddress: new PublicKey(walletAddress),
          metadata: metadata ? new PublicKey(metadata) : null,
        });
        setTransactionSheetArgs({
          feePayer,
          theme,
          walletAddress,
          callback: (signature) =>
            signature && !metadata ? setPage(Page.Main) : setStep(3),
          signers: [],
          ixs,
        });
      }
    } catch (error) {
      logError(error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : String(error)
      );
    }
  }, [walletAddress, theme, metadata]);

  const handleOnPress = useCallback(async () => {
    try {
      if (Platform.OS === "android") {
        setIsNfcSheetVisible(true);
      }

      const data = await nfcCore.readSecureElement({
        blockchain: BLOCKCHAIN.SOLANA,
        mint: walletInfo?.metadata || undefined,
      });
      if (data) {
        const parsedData = {
          ...data,
          type: WalletType.MULTIWALLET,
          address: data.walletAddress,
          mint: data.mint ? data.mint : null,
          theme: "accent" as ThemeName,
        };
        setPreviousData(parsedData);
        setWalletSheetArgs(parsedData);
      }
    } catch (error) {
      logError(error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      if (Platform.OS === "android") {
        setIsNfcSheetVisible(false);
      }
      nfcCore.close();
    }
  }, [walletInfo]);
  const { height } = useWindowDimensions();
  return (
    <YStack flex={1} items="center">
      <Header
        props={{ px: "$2", pt: "$4" }}
        text={
          step == 0
            ? "NFC Wallet Set Up"
            : step === 1
            ? "Add Wallet to Multisig"
            : step == 2
            ? "(Optional) Add Metadata"
            : "Complete NFC Wallet Set Up"
        }
      />
      <Sheet.ScrollView
        showsVerticalScrollIndicator={false}
        width={"100%"}
        height={"100%"}
        contentContainerStyle={{
          grow: 1,
          pt: 16,
          px: 16,
          pb: Math.round(height * 0.15),
        }}
      >
        {step == 0 && (
          <YStack gap={"$8"} p={"$4"} items="center">
            <Text
              text="center"
              fontSize={"$5"}
            >{`Would you like to create a new multisig wallet or add this wallet to an existing multisig wallet?`}</Text>

            <XStack gap={"$4"}>
              <CustomButton
                bordered
                height={"$8"}
                theme={"green"}
                width={"50%"}
                onPress={() => {
                  if (metadata) {
                    handleCreateOrEdit();
                  } else {
                    setStep(2);
                  }
                }}
                p={"$1"}
              >
                <ButtonText numberOfLines={3} width={"80%"} text="center">
                  Create New Multisig Wallet
                </ButtonText>
              </CustomButton>
              <CustomButton
                bordered
                height={"$8"}
                theme={"blue"}
                width={"50%"}
                onPress={() => {
                  setStep(1);
                }}
                p={"$1"}
              >
                <ButtonText numberOfLines={3} width={"80%"} text="center">
                  Add Wallet to Existing Multisig
                </ButtonText>
              </CustomButton>
            </XStack>
          </YStack>
        )}
        {step == 1 && (
          <YStack
            enterStyle={{ opacity: 0, x: -25 }}
            animation={"quick"}
            gap={"$8"}
            p={"$4"}
            items="center"
          >
            <Text text="center" fontSize={"$5"}>
              {
                "Copy the wallet address below to add it as a member of an existing multisig wallet."
              }
            </Text>
            <YStack
              gap={"$4"}
              items="center"
              justify="center"
              p={"$4"}
              borderWidth={"$1"}
              borderTopLeftRadius={"$4"}
              borderTopRightRadius={"$4"}
              borderBottomLeftRadius={"$4"}
              borderBottomRightRadius={"$4"}
            >
              <Heading size={"$1"}>NFC Hardware Wallet Address</Heading>
              <CustomButton
                bordered
                onPress={() => copyToClipboard(walletAddress || "")}
              >
                <ButtonText>{`${walletAddress}`}</ButtonText>
                <ButtonIcon children={<Copy />}></ButtonIcon>
              </CustomButton>
            </YStack>

            <CustomButton width={"80%"} onPress={() => setStep(0)}>
              Back
            </CustomButton>
          </YStack>
        )}
        {step == 2 && (
          <YStack
            enterStyle={{ opacity: 0, x: -25 }}
            animation={"quick"}
            gap={"$8"}
            p={"$4"}
            items="center"
          >
            <Text text="center" fontSize={"$5"}>
              {
                "Associate an NFT or Token to your multisig wallet. The multisig wallet will be themed using the selected token."
              }
            </Text>
            {metadata && (
              <ListItem
                padded
                borderTopLeftRadius={"$4"}
                borderTopRightRadius={"$4"}
                borderBottomLeftRadius={"$4"}
                borderBottomRightRadius={"$4"}
                onPress={() => setMetadata(null)}
                title={metadata}
                subTitle={"Mint Address"}
                iconAfter={<Trash2 size={"$1"} />}
              />
            )}
            {(metadata === null || (metadata?.length || 0) < 32) && (
              <Input
                width={"90%"}
                size={"$4"}
                value={metadata || ""}
                onChangeText={setMetadata}
                placeholder="Enter the NFT or Token mint address"
              />
            )}
            <YStack gap={"$2"} width={"80%"}>
              <CustomButton onPress={handleCreateOrEdit}>
                <ButtonText text="center">Continue</ButtonText>
              </CustomButton>
              <CustomButton
                onPress={() => (walletInfo?.metadata ? setStep(3) : setStep(0))}
              >
                Back
              </CustomButton>
            </YStack>
          </YStack>
        )}
        {step == 3 && (
          <YStack p={"$4"} gap={"$8"} items="center">
            <Text text="center" fontSize={"$5"}>
              {
                "Scan your hardware wallet to write the following data onto the card."
              }
            </Text>
            <YGroup>
              <YGroup.Item>
                <ListItem
                  padded
                  title={walletInfo?.createKey}
                  subTitle={"Wallet Address"}
                />
              </YGroup.Item>
              <YGroup.Item>
                <ListItem
                  padded
                  title={walletInfo?.metadata}
                  subTitle={"Mint Address"}
                  iconAfter={
                    <CustomButton
                      onPress={() => {
                        setMetadata(walletInfo?.metadata);
                        setStep(2);
                      }}
                      size={"$3"}
                    >
                      <ButtonIcon>
                        <RefreshCcw />
                      </ButtonIcon>
                      <ButtonText>Change</ButtonText>
                    </CustomButton>
                  }
                />
              </YGroup.Item>
            </YGroup>
            <CustomButton size={"$5"} onPress={handleOnPress}>
              Write NFC Wallet
            </CustomButton>
          </YStack>
        )}
      </Sheet.ScrollView>
    </YStack>
  );
};
