import { BLOCKCHAIN } from "@revibase/nfc-core/dist/utils/const";
import { History } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { useCallback } from "react";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ButtonIcon,
  ButtonText,
  Heading,
  Spinner,
  ThemeName,
  XStack,
  YStack,
} from "tamagui";
import { WalletType, logError, nfcCore, useGlobalStore } from "utils";

export default function index() {
  const {
    isNfcSheetVisible,
    setIsNfcSheetVisible,
    setWalletSheetArgs,
    previousData,
    setPreviousData,
  } = useGlobalStore();

  const handleOnPress = useCallback(async () => {
    try {
      setIsNfcSheetVisible(true);
      const data = await nfcCore.readSecureElement({
        blockchain: BLOCKCHAIN.SOLANA,
        mint: undefined,
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
      if (error.message) {
        logError(error);
        Alert.alert("Error", error.message);
      }
    } finally {
      setIsNfcSheetVisible(false);
    }
  }, []);
  const handleViewPreviousData = useCallback(() => {
    if (previousData) {
      setWalletSheetArgs(previousData);
    }
  }, [previousData]);
  const { top } = useSafeAreaInsets();

  return (
    <YStack
      mt={top}
      flex={1}
      justify={"center"}
      items="center"
      position="relative"
    >
      <YStack position="absolute" t={"$0"} p={"$4"} width={"100%"}>
        {previousData && (
          <XStack justify={"flex-end"}>
            <CustomButton
              size={"$5"}
              onPress={handleViewPreviousData}
              p={"$0"}
              bg={"transparent"}
            >
              <YStack justify="center" items="center">
                <ButtonIcon children={<History size={"$2"} />} />
                <ButtonText fontSize={"$2"}>Previous</ButtonText>
              </YStack>
            </CustomButton>
          </XStack>
        )}
      </YStack>

      <CustomButton
        size={"$16"}
        bordered
        circular
        themeInverse
        shadowRadius={"$4"}
        elevate
        disabled={isNfcSheetVisible}
        onPress={handleOnPress}
      >
        {isNfcSheetVisible ? (
          <Spinner size="large" />
        ) : (
          <Heading>Scan NFC</Heading>
        )}
      </CustomButton>
    </YStack>
  );
}
