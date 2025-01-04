import { PublicKey } from "@solana/web3.js";
import { useToastController } from "@tamagui/toast";
import { CustomButton } from "components/CustomButton";
import { useGlobalVariables } from "components/providers/globalProvider";
import { WalletSheets } from "components/wallet/sheets";
import { useCallback, useState } from "react";
import { ButtonText, useTheme, YStack } from "tamagui";
import NfcProxy from "utils/apdu";
import { CHAIN } from "utils/consts";
import { SignerType } from "utils/enums/transaction";

export default function index() {
  const [data, setData] = useState<{
    walletAddress: PublicKey;
    mint: PublicKey | null;
  } | null>(null);

  const { isNfcSheetVisible, setNfcSheetVisible } = useGlobalVariables();
  const toast = useToastController();
  const theme = useTheme();

  const handleOnPress = useCallback(async () => {
    try {
      setNfcSheetVisible(true);
      const data = await NfcProxy.readSecureElement(CHAIN["SOLANA"]);
      if (data) {
        setData(data);
      }
    } catch (error) {
      toast.show(error.message, { customData: { preset: "error" } });
    } finally {
      setNfcSheetVisible(false);
    }
  }, []);
  return (
    <YStack flex={1} alignItems="center" justifyContent="center">
      <CustomButton
        padded
        bordered
        size={"$16"}
        circular
        shadowRadius={"$4"}
        shadowColor={theme.color?.val}
        elevate
        elevation={"$2"}
        elevationAndroid={"$2"}
        themeInverse
        disabled={isNfcSheetVisible}
        onPress={handleOnPress}
      >
        <ButtonText fontSize={"$7"}>
          {isNfcSheetVisible ? "In Progress" : "Tap to Scan"}
        </ButtonText>
      </CustomButton>
      <WalletSheets
        type={SignerType.NFC}
        address={data?.walletAddress}
        reset={() => setData(null)}
        mint={data?.mint}
      />
    </YStack>
  );
}
