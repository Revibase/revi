import { PublicKey } from "@solana/web3.js";
import { useOnboarding } from "components/providers/onboardingProvider";
import { Wallet } from "components/wallet";
import { useState } from "react";
import { SafeAreaView } from "react-native";
import { Button, ButtonText, Sheet, YStack } from "tamagui";
import { CHAIN } from "utils/consts";
import { BLOCKCHAIN } from "utils/enums/chain";
import { useReadSecureElement } from "utils/mutations/readSecureElement";

export default function index() {
  const readSecureElementMutation = useReadSecureElement({
    blockchain: CHAIN.SOLANA,
  });
  const [data, setData] = useState<{
    walletAddress: PublicKey;
    mint: PublicKey;
    blockchain: BLOCKCHAIN;
  } | null>(null);

  const { deviceAddress, cloudAddress } = useOnboarding();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Button
          circular
          size={"$16"}
          theme="active"
          elevate
          elevation={"4"}
          borderColor={"$accentColor"}
          shadowColor={"aliceblue"}
          shadowRadius={"$4"}
          disabled={readSecureElementMutation.isPending}
          onPress={async () => {
            setData({
              walletAddress: new PublicKey(
                "CLKBJ7CvY59FdFAu2GryZeWnz7k3T4SgM79UzDrxJaDe"
              ),
              mint: new PublicKey(
                "So11111111111111111111111111111111111111112"
              ),
              blockchain: BLOCKCHAIN.SOLANA,
            });
            // const data = await readSecureElementMutation.mutateAsync();
            // if (data) {
            //   setData(data);
            // }
          }}
        >
          <ButtonText fontSize={"$8"}>
            {readSecureElementMutation.isPending
              ? "Operation In Progress"
              : "Tap To Reveal"}
          </ButtonText>
        </Button>
        <Sheet
          forceRemoveScrollEnabled={true}
          modal={true}
          open={!!data}
          defaultOpen={false}
          snapPoints={[80]}
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

          <Sheet.Handle theme={"light"} />
          <Sheet.Frame
            padding="$4"
            justifyContent="center"
            alignItems="center"
            gap="$4"
            theme={"light"}
          >
            <Sheet.ScrollView>
              <Wallet
                walletAddress={data?.walletAddress}
                mint={data?.mint}
                blockchain={data?.blockchain}
                deviceAddress={deviceAddress || undefined}
                cloudAddress={cloudAddress || undefined}
                close={() => setData(null)}
              />
            </Sheet.ScrollView>
          </Sheet.Frame>
        </Sheet>
      </YStack>
    </SafeAreaView>
  );
}
