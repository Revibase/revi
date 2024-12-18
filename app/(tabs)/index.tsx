import { PublicKey } from "@solana/web3.js";
import { useToastController } from "@tamagui/toast";
import { useGlobalVariables } from "components/providers/globalProvider";
import { Wallet } from "components/wallet";
import { useState } from "react";
import { Platform } from "react-native";
import { Button, ButtonText, Sheet, Spinner, Text, YStack } from "tamagui";
import { CHAIN } from "utils/consts";
import { BLOCKCHAIN } from "utils/enums/chain";
import NfcProxy from "../../utils/apdu/index";

export default function index() {
  const [data, setData] = useState<{
    walletAddress: PublicKey;
    mint: PublicKey;
    blockchain: BLOCKCHAIN;
  } | null>(null);

  const { isNfcSheetVisible, setNfcSheetVisible } = useGlobalVariables();
  const toast = useToastController();
  return (
    <YStack flex={1} justifyContent="center" alignItems="center">
      <Button
        padded
        bordered
        size={"$16"}
        circular
        elevate
        elevation={"$4"}
        shadowColor={"black"}
        shadowRadius={"$4"}
        disabled={isNfcSheetVisible}
        onPress={async () => {
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
        }}
      >
        <ButtonText fontSize={"$8"}>
          {isNfcSheetVisible ? "In Progress" : "Tap To Reveal"}
        </ButtonText>
      </Button>
      <Sheet
        forceRemoveScrollEnabled={true}
        dismissOnOverlayPress
        modal={true}
        open={!!data}
        defaultOpen={false}
        snapPoints={[95]}
        zIndex={100_000}
        animation="medium"
        snapPointsMode={"percent"}
        onOpenChange={(open) => {
          if (!open) {
            setData(null);
          }
        }}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          key="overlay"
          opacity={0.5}
        />

        <Sheet.Handle />
        <Sheet.Frame
          padding="$4"
          justifyContent="center"
          alignItems="center"
          gap="$4"
        >
          <Sheet.ScrollView width={"100%"} showsVerticalScrollIndicator={false}>
            {data && (
              <Wallet
                walletAddress={data.walletAddress}
                mint={data.mint}
                close={() => {
                  setData(null);
                }}
              />
            )}
          </Sheet.ScrollView>
        </Sheet.Frame>
      </Sheet>
      <Sheet
        forceRemoveScrollEnabled
        modal={true}
        open={isNfcSheetVisible && Platform.OS === "android"}
        snapPoints={[50]}
        defaultOpen={false}
        zIndex={200_000}
        animation="medium"
        snapPointsMode="percent"
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          key="nfc-overlay"
          opacity={0.5}
          onPress={async () => {
            await NfcProxy.close();
            setNfcSheetVisible(false);
          }}
        />

        <Sheet.Handle />
        <Sheet.Frame
          padding="$8"
          justifyContent="center"
          alignItems="center"
          gap="$8"
        >
          <Spinner size="large" color="$color" />
          <Text fontSize="$6" fontWeight="bold">
            Hold your device near an NFC tag.
          </Text>
          <Button
            width={"100%"}
            onPress={async () => {
              await NfcProxy.close();
              setNfcSheetVisible(false);
            }}
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
