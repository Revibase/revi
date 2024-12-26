import { PublicKey } from "@solana/web3.js";
import { useToastController } from "@tamagui/toast";
import { useGlobalVariables } from "components/providers/globalProvider";
import { ScreenWrapper } from "components/screenWrapper";
import { WalletSheets } from "components/wallet/sheets";
import { useCallback, useState } from "react";
import { Button, ButtonText, useTheme, YStack } from "tamagui";
import { CHAIN } from "utils/consts";
import { BLOCKCHAIN } from "utils/enums/chain";
import { SignerType } from "utils/enums/transaction";
import NfcProxy from "../../utils/apdu";

export default function index() {
  const [data, setData] = useState<{
    walletAddress: PublicKey;
    mint: PublicKey;
    blockchain: BLOCKCHAIN;
  } | null>(null);

  const { isNfcSheetVisible, setNfcSheetVisible } = useGlobalVariables();
  const toast = useToastController();
  const theme = useTheme();

  const handleOnPress = useCallback(async () => {
    try {
      const data = await NfcProxy.readSecureElement(
        CHAIN["SOLANA"],
        setNfcSheetVisible
      );
      if (data) {
        setData(data);
      }
    } catch (error) {
      toast.show(error.message, { customData: { preset: "error" } });
    }
  }, []);
  return (
    <ScreenWrapper>
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Button
          padded
          bordered
          hoverTheme
          pressTheme
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
          <ButtonText fontSize={"$8"}>
            {isNfcSheetVisible ? "In Progress" : "Tap To Reveal"}
          </ButtonText>
        </Button>
        <WalletSheets
          type={SignerType.NFC}
          address={data?.walletAddress}
          reset={() => setData(null)}
          mint={data?.mint}
        />
      </YStack>
    </ScreenWrapper>
  );
}
