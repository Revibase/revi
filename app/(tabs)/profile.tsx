import { PublicKey } from "@solana/web3.js";
import {
  FileLock2,
  Import,
  KeySquare,
  WalletCards,
} from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { useGlobalVariables } from "components/providers/globalProvider";
import { WalletSheets } from "components/wallet/sheets";
import { FC, useEffect, useMemo, useState } from "react";
import {
  ButtonText,
  Card,
  Heading,
  Image,
  ListItem,
  ScrollView,
  Spinner,
  Text,
  TextArea,
  XStack,
  YStack,
} from "tamagui";
import { PLACEHOLDER_IMAGE } from "utils/consts";
import { SignerType } from "utils/enums/transaction";
import { WalletFlow, WalletType } from "utils/enums/wallet";
import { useGenerateWallet } from "utils/mutations/generateWallet";
import { useGetMultisigByOwner } from "utils/queries/useGetMultisigByOwner";

export default function profile() {
  const { deviceWalletPublicKey, passkeyWalletPublicKey } =
    useGlobalVariables();
  if (deviceWalletPublicKey && passkeyWalletPublicKey) {
    return <Profile />;
  }
  return <Onboarding />;
}

const Profile: FC<{}> = () => {
  const { deviceWalletPublicKey, passkeyWalletPublicKey } =
    useGlobalVariables();
  const { data: multiWallets } = useGetMultisigByOwner();
  const [address, setAddress] = useState<PublicKey | undefined | null>(null);
  const [mint, setMint] = useState<PublicKey | null>(null);
  const [type, setType] = useState(SignerType.NFC);

  const reset = () => {
    setAddress(null);
    setMint(null);
    setType(SignerType.NFC);
  };
  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <YStack gap={"$4"} padding="$4">
        <Heading>Wallets</Heading>
        <XStack
          alignSelf="center"
          gap={"$2"}
          justifyContent="space-between"
          alignItems="center"
        >
          <ListItem
            width={"50%"}
            borderRadius={"$4"}
            padded
            bordered
            hoverTheme
            pressTheme
            hoverStyle={{ scale: 0.925 }}
            pressStyle={{ scale: 0.925 }}
            animation="bouncy"
            theme={"blue"}
            title={"Device Wallet"}
            subTitle={deviceWalletPublicKey?.toString()}
            onPress={() => {
              setType(SignerType.DEVICE);
              setAddress(deviceWalletPublicKey);
              setMint(null);
            }}
          />
          <ListItem
            width={"50%"}
            borderRadius={"$4"}
            padded
            bordered
            hoverTheme
            pressTheme
            hoverStyle={{ scale: 0.925 }}
            pressStyle={{ scale: 0.925 }}
            animation="bouncy"
            theme={"green"}
            title={"Passkey Wallet"}
            subTitle={passkeyWalletPublicKey?.toString()}
            onPress={() => {
              setType(SignerType.PASSKEY);
              setAddress(passkeyWalletPublicKey);
              setMint(null);
            }}
          />
        </XStack>
        <YStack width={"100%"} gap="$2">
          <Heading size={"$6"}>Your Collectible Wallets</Heading>
          <YStack width={"100%"} flexWrap="wrap" flexDirection="row" gap="$4">
            {multiWallets?.map((x) => {
              return (
                <YStack
                  key={x.createKey.toString()}
                  width="33%"
                  gap={"$2"}
                  aspectRatio={1}
                  justifyContent="space-between"
                  alignItems="center"
                  backgroundColor={"$colorTransparent"}
                  hoverStyle={{ scale: 0.925 }}
                  pressStyle={{ scale: 0.875 }}
                  animation="bouncy"
                  onPress={() => {
                    setType(SignerType.NFC);
                    setAddress(new PublicKey(x.createKey));
                    setMint(x.metadata);
                  }}
                >
                  <XStack
                    paddingHorizontal={"$2"}
                    justifyContent="center"
                    alignItems="baseline"
                    gap={"$1"}
                  >
                    <Text theme={"alt1"} fontSize={"$1"}>
                      USD
                    </Text>
                    <Text
                      theme={"active"}
                      numberOfLines={1}
                      fontSize={"$5"}
                      fontWeight={"800"}
                    >
                      {`${x.totalValue}`}
                    </Text>
                  </XStack>
                  <Card elevate height={"80%"} width={"56%"}>
                    <Card.Background>
                      <Image
                        height={"100%"}
                        width={"100%"}
                        borderWidth={"$1"}
                        borderRadius={"$2"}
                        objectFit="cover"
                        source={{
                          uri:
                            x?.data?.content?.links?.image || PLACEHOLDER_IMAGE,
                        }}
                        alt="image"
                      />
                    </Card.Background>
                  </Card>
                  <Text
                    paddingHorizontal={"$2"}
                    numberOfLines={1}
                    fontSize={"$3"}
                  >
                    {x.data?.content?.metadata.name || x.vaultAddress}
                  </Text>
                </YStack>
              );
            })}
          </YStack>
        </YStack>
        <WalletSheets type={type} address={address} reset={reset} mint={mint} />
      </YStack>
    </ScrollView>
  );
};

const Onboarding: FC = () => {
  const { deviceWalletPublicKey } = useGlobalVariables();
  const generateWalletMutation = useGenerateWallet();
  const [mnemonic, setMnemonic] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState(1);
  const [signUp, setSignUp] = useState(false);
  useEffect(() => {
    if (deviceWalletPublicKey) {
      setStep(4);
    }
  }, [deviceWalletPublicKey]);
  const renderStep = useMemo(() => {
    switch (step) {
      case 1:
        return (
          <>
            <Heading padding={"$4"}>Set Up Your Wallets</Heading>
            <WalletCards size={"$12"} />
            <Text textAlign="center" fontSize={"$6"}>
              In the upcoming steps, you’ll set up both a device and passkey
              wallet, which are essential for transaction approvals.
            </Text>
            <CustomButton theme="active" onPress={() => setStep(2)}>
              <ButtonText width={"80%"} textAlign="center">
                Continue
              </ButtonText>
            </CustomButton>
          </>
        );
      case 2:
        return (
          <>
            <Heading padding={"$4"}>Set Up Device Wallet</Heading>
            <FileLock2 size={"$12"} />
            <Text textAlign="center" fontSize={"$6"}>
              {`The wallet's private key will be securely stored on your device and protected by your biometrics.\n\nCreate a new wallet or import an existing seed phrase to set up your wallet.`}
            </Text>
            <YStack gap={"$2"} width={"80%"}>
              <CustomButton
                theme={"active"}
                onPress={() =>
                  generateWalletMutation.mutateAsync({
                    walletType: WalletType.DEVICE,
                    walletFlow: WalletFlow.CreateNew,
                  })
                }
              >
                {generateWalletMutation.isPending && <Spinner />}
                <ButtonText textAlign="center">Create Wallet</ButtonText>
              </CustomButton>
              <CustomButton
                onPress={() => setStep(3)}
                variant="outlined"
                borderWidth={"$0"}
              >
                <ButtonText>Import Seed Phrase</ButtonText>
              </CustomButton>
            </YStack>
          </>
        );
      case 3:
        return (
          <>
            <Heading padding={"$4"}>Import Seed Phrase</Heading>
            <Import size={"$12"} />
            <TextArea
              numberOfLines={5}
              autoFocus
              autoCorrect={false}
              inputMode="text"
              width={"100%"}
              value={mnemonic}
              onChangeText={setMnemonic}
              placeholder={`Enter the 24 word seed phrase to import your wallet`}
            />
            <YStack gap={"$2"} width={"80%"}>
              <CustomButton
                theme={"active"}
                onPress={() => {
                  generateWalletMutation.mutateAsync({
                    walletFlow: WalletFlow.UseExisting,
                    walletType: WalletType.DEVICE,
                    mnemonic: mnemonic,
                  });
                }}
              >
                {generateWalletMutation.isPending && <Spinner />}
                <ButtonText textAlign="center">Import Wallet</ButtonText>
              </CustomButton>
              <CustomButton
                onPress={() => setStep(2)}
                variant="outlined"
                borderWidth={"$0"}
              >
                <ButtonText>Back</ButtonText>
              </CustomButton>
            </YStack>
          </>
        );
      case 4:
        return (
          <>
            <Heading padding="$4">Set Up Passkey Wallet</Heading>
            <KeySquare size={"$12"} />
            <Text textAlign="center" fontSize="$6">
              {signUp
                ? "Choose a name for your new passkey wallet for easy identification."
                : `The wallet's private key is securely stored on the cloud and can only be accessed using your passkeys.\n\nSign in with an existing passkey or Register to create a new wallet.`}
            </Text>
            {signUp && (
              <TextArea
                width={"100%"}
                value={name}
                onChangeText={setName}
                placeholder="Enter your wallet name"
                inputMode="text"
              />
            )}
            <YStack gap="$2" width="80%">
              <CustomButton
                theme={"active"}
                onPress={() => {
                  generateWalletMutation.mutateAsync({
                    walletType: WalletType.PASSKEY,
                    walletFlow: signUp
                      ? WalletFlow.CreateNew
                      : WalletFlow.UseExisting,
                    userName: name,
                  });
                }}
              >
                {generateWalletMutation.isPending && <Spinner />}
                <ButtonText textAlign="center">
                  {signUp ? "Continue With Passkey" : "Sign In with Passkey"}
                </ButtonText>
              </CustomButton>
              <CustomButton
                onPress={() => setSignUp(!signUp)}
                variant="outlined"
                borderWidth="$0"
              >
                <ButtonText>
                  {signUp ? "Back" : "Register New Wallet"}
                </ButtonText>
              </CustomButton>
            </YStack>
          </>
        );
      default:
        return <></>;
    }
  }, [
    name,
    setName,
    mnemonic,
    setMnemonic,
    step,
    setStep,
    signUp,
    setSignUp,
    generateWalletMutation,
  ]);
  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <YStack alignItems="center" flex={1} padding={"$8"} gap={"$8"}>
        {renderStep}
      </YStack>
    </ScrollView>
  );
};
