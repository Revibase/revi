import { PublicKey } from "@solana/web3.js";
import { History } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { useGlobalVariables } from "components/providers/globalProvider";
import { WalletSheets } from "components/wallet/sheets";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ButtonIcon, ButtonText, useTheme, YStack } from "tamagui";
import { CHAIN } from "utils/consts";
import { WalletType } from "utils/enums/wallet";
import NfcProxy from "../../utils/apdu";

export default function index() {
  const [data, setData] = useState<{
    walletAddress: string;
    mint: string | null;
  } | null>(null);

  const [previousData, setPreviousData] = useState<{
    walletAddress: string;
    mint: string | null;
  } | null>(null);

  const { isNfcSheetVisible, setNfcSheetVisible } = useGlobalVariables();
  const theme = useTheme();

  const handleOnPress = useCallback(async () => {
    try {
      setNfcSheetVisible(true);

      const data = await NfcProxy.readSecureElement(CHAIN["SOLANA"]);

      if (data) {
        setPreviousData(data);
        setData(data);
      }
    } catch (error) {
      Alert.alert("Error Reading NFC Tag", error.message);
    } finally {
      setNfcSheetVisible(false);
    }
  }, []);
  const handleViewPreviousData = useCallback(() => {
    if (previousData) {
      setData(previousData);
    }
  }, [previousData]);
  const { top } = useSafeAreaInsets();
  return (
    <YStack
      paddingTop={top}
      flex={1}
      alignItems="center"
      justifyContent="center"
    >
      {previousData && (
        <YStack position="absolute" top={top + 32} right={"$4"}>
          <CustomButton
            size={"$5"}
            onPress={handleViewPreviousData}
            padding={"$0"}
            backgroundColor={"$colorTransparent"}
          >
            <YStack gap="$1" alignItems="center" justifyContent="center">
              <ButtonIcon children={<History size={"$2"} />} />
              <ButtonText fontSize={"$2"}>Previous</ButtonText>
            </YStack>
          </CustomButton>
        </YStack>
      )}
      <CustomButton
        padded
        bordered
        size={"$16"}
        circular
        shadowRadius={"$4"}
        shadowColor={theme.color.val}
        elevate
        elevation={"$2"}
        elevationAndroid={"$2"}
        themeInverse
        disabled={isNfcSheetVisible}
        onPress={handleOnPress}
      >
        <ButtonText fontSize={"$8"}>
          {isNfcSheetVisible ? "Verifying..." : "Tap To Verify"}
        </ButtonText>
      </CustomButton>
      <WalletSheets
        type={WalletType.MULTIWALLET}
        address={data?.walletAddress ? new PublicKey(data.walletAddress) : null}
        reset={() => setData(null)}
        mint={data?.mint ? new PublicKey(data.mint) : null}
      />
    </YStack>
  );
}
