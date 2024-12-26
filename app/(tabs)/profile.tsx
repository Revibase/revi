import { PublicKey } from "@solana/web3.js";
import {
  EllipsisVertical,
  FileLock2,
  Import,
  KeySquare,
} from "@tamagui/lucide-icons";
import { useGlobalVariables } from "components/providers/globalProvider";
import { ScreenWrapper } from "components/screenWrapper";
import { WalletSheets } from "components/wallet/sheets";
import { FC, useEffect, useState } from "react";
import {
  Button,
  ButtonText,
  Heading,
  Image,
  Input,
  ListItem,
  Text,
  TextArea,
  XStack,
  YStack,
} from "tamagui";
import { SignerType } from "utils/enums/transaction";
import { getAssetBatch } from "utils/helper";
import { useGeneratePrimaryWallet } from "utils/mutations/generatePrimaryWallet";
import {
  Flow,
  useGenerateSecondaryWallet,
} from "utils/mutations/generateSecondaryWallet";
import { useGetMultisigByOwner } from "utils/queries/useGetMultisigByOwner";
import { DAS } from "utils/types/das";

export default function profile() {
  const { primaryAddress, secondaryAddress } = useGlobalVariables();

  return primaryAddress && secondaryAddress ? <Profile /> : <Onboarding />;
}

const Onboarding: FC = () => {
  const { primaryAddress } = useGlobalVariables();
  const generateSecondaryWalletMutation = useGenerateSecondaryWallet();
  const generatePrimaryWalletMutation = useGeneratePrimaryWallet();
  const [mnemonic, setMnemonic] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState(1);
  const [signUp, setSignUp] = useState(false);
  useEffect(() => {
    if (primaryAddress) {
      setStep(4);
    }
  }, [primaryAddress]);
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <YStack alignItems="center" flex={1} padding={"$4"}>
            <Heading padding={"$4"}>Set Up Your Wallets</Heading>
            <YStack
              justifyContent="center"
              alignItems="center"
              flex={1}
              gap={"$8"}
            >
              <Text textAlign="center" fontSize={"$6"}>
                In the upcoming steps, you’ll set up both a primary and
                secondary wallet, which are essential for transaction approvals.
              </Text>
              <Button onPress={() => setStep(2)}>
                <ButtonText width={"80%"} textAlign="center">
                  Continue
                </ButtonText>
              </Button>
            </YStack>
          </YStack>
        );
      case 2:
        return (
          <YStack alignItems="center" flex={1} padding={"$4"}>
            <Heading padding={"$4"}>Set Up Primary Wallet</Heading>
            <YStack
              gap={"$8"}
              justifyContent="center"
              alignItems="center"
              flex={1}
            >
              <FileLock2 size={"$12"} />
              <Text textAlign="center" fontSize={"$6"}>
                {`The wallet's private key will be securely stored on your device and protected by your biometrics.\n\nCreate a new wallet or import an existing seed phrase to set up your wallet.`}
              </Text>
              <YStack gap={"$2"}>
                <Button
                  onPress={() => generatePrimaryWalletMutation.mutateAsync({})}
                >
                  <ButtonText width={"80%"} textAlign="center">
                    Create Wallet
                  </ButtonText>
                </Button>
                <Button
                  onPress={() => setStep(3)}
                  variant="outlined"
                  borderWidth={"$0"}
                  hoverTheme
                  pressTheme
                  color={"$accentColor"}
                >
                  <ButtonText>Import Seed Phrase</ButtonText>
                </Button>
              </YStack>
            </YStack>
          </YStack>
        );
      case 3:
        return (
          <YStack alignItems="center" flex={1} padding={"$4"}>
            <Heading padding={"$4"}>Import Seed Phrase</Heading>
            <YStack
              gap={"$8"}
              justifyContent="center"
              alignItems="center"
              flex={1}
            >
              <Import size={"$12"} />
              <Text textAlign="center" fontSize={"$6"}>
                {`Use your 24 word seed phrase to import your wallet.`}
              </Text>
              <TextArea
                value={mnemonic}
                onChangeText={setMnemonic}
                placeholder="Enter your seed phrase..."
              />
              <YStack gap={"$2"}>
                <Button
                  onPress={() =>
                    generatePrimaryWalletMutation.mutateAsync({ mnemonic })
                  }
                >
                  <ButtonText width={"80%"} textAlign="center">
                    Import Wallet
                  </ButtonText>
                </Button>
                <Button
                  onPress={() => setStep(2)}
                  variant="outlined"
                  borderWidth={"$0"}
                  hoverTheme
                  pressTheme
                  color={"$accentColor"}
                >
                  <ButtonText>Back</ButtonText>
                </Button>
              </YStack>
            </YStack>
          </YStack>
        );
      case 4:
        return (
          <YStack alignItems="center" flex={1} padding="$4">
            <Heading padding="$4">Set Up Secondary Wallet</Heading>
            <YStack
              gap="$8"
              justifyContent="center"
              alignItems="center"
              flex={1}
            >
              <KeySquare size={"$12"} />
              <Text textAlign="center" fontSize="$6">
                {signUp
                  ? "Choose a name for your new passkey wallet for easy identification."
                  : `The wallet's private key is securely stored on the cloud and can only be accessed using your passkeys.\n\nSign In with an existing Passkey or Register to create a new wallet.`}
              </Text>
              <YStack gap="$2" width="100%">
                {signUp && (
                  <Input
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your wallet name"
                    inputMode="text"
                  />
                )}
                <Button
                  onPress={() => {
                    generateSecondaryWalletMutation.mutateAsync({
                      flow: signUp ? Flow.SignUp : Flow.Login,
                      userName: name,
                    });
                  }}
                >
                  <ButtonText width="80%" textAlign="center">
                    {signUp ? "Continue With Passkey" : "Sign In with Passkey"}
                  </ButtonText>
                </Button>

                {/* Toggle Button */}
                <Button
                  onPress={() => setSignUp(!signUp)}
                  variant="outlined"
                  borderWidth="$0"
                  hoverTheme
                  pressTheme
                  color="$accentColor"
                >
                  <ButtonText>
                    {signUp ? "Back" : "Register New Wallet"}
                  </ButtonText>
                </Button>
              </YStack>
            </YStack>
          </YStack>
        );

      default:
        return null;
    }
  };
  return (
    <ScreenWrapper>
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="space-evenly"
        gap="$8"
        paddingHorizontal={"$4"}
      >
        {renderStep()}
      </YStack>
    </ScreenWrapper>
  );
};
const Profile: FC<{}> = () => {
  const { primaryAddress, secondaryAddress } = useGlobalVariables();
  const { data: multiWallets } = useGetMultisigByOwner({
    address: secondaryAddress,
  });
  const [multiWalletsWithData, setMultiWalletsWithData] = useState<
    {
      data: DAS.GetAssetResponse | undefined;
      publicKey: PublicKey;
      account: {
        createKey: PublicKey;
        threshold: number;
        bump: number;
        members: PublicKey[];
        label: string | null;
      };
    }[]
  >([]);

  useEffect(() => {
    const fetchMultiWalletData = async () => {
      if (!multiWallets) return;

      const filteredLabels = multiWallets
        .filter((x) => !!x.account.label)
        .map((x) => x.account.label!);

      try {
        const multiWalletData = await getAssetBatch(filteredLabels);

        const walletsWithData = multiWallets.map((x) => ({
          ...x,
          data: multiWalletData.find((data) => data.id === x.account.label),
        }));

        setMultiWalletsWithData(walletsWithData);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
      }
    };

    fetchMultiWalletData();
  }, [multiWallets]);
  const [address, setAddress] = useState<PublicKey | undefined | null>(null);
  const [mint, setMint] = useState<PublicKey | undefined>(undefined);
  const [type, setType] = useState(SignerType.NFC);

  const reset = () => {
    setAddress(null);
    setMint(undefined);
    setType(SignerType.NFC);
  };
  return (
    <ScreenWrapper>
      <YStack gap={"$4"} padding="$4">
        <Heading>Wallets</Heading>
        <XStack
          width={"100%"}
          alignSelf="center"
          gap={"$4"}
          justifyContent="space-between"
          alignItems="center"
        >
          <ListItem
            maxWidth={"48%"}
            borderRadius={"$4"}
            padded
            bordered
            hoverTheme
            pressTheme
            theme={"blue"}
            title={"Primary Wallet"}
            subTitle={primaryAddress?.toString()}
            iconAfter={<EllipsisVertical />}
            onPress={() => {
              setType(SignerType.PRIMARY);
              setAddress(primaryAddress);
              setMint(undefined);
            }}
          />
          <ListItem
            maxWidth={"48%"}
            borderRadius={"$4"}
            padded
            bordered
            hoverTheme
            pressTheme
            theme={"green"}
            title={"Secondary Wallet"}
            subTitle={secondaryAddress?.toString()}
            iconAfter={<EllipsisVertical />}
            onPress={() => {
              setType(SignerType.SECONDARY);
              setAddress(secondaryAddress);
              setMint(undefined);
            }}
          />
        </XStack>
        <YStack width={"100%"} gap="$2">
          <Heading size={"$6"}>Your Multisig Wallets</Heading>
          <YStack
            width={"100%"}
            flexWrap="wrap" // Allow items to wrap within the container
            flexDirection="row" // Make the children flow in rows
            gap="$4" // Spacing between grid items
          >
            {multiWalletsWithData?.map((x) => {
              return (
                <Button
                  padded={false}
                  key={x.publicKey.toString()}
                  width="50%"
                  aspectRatio={1}
                  justifyContent="center"
                  alignItems="center"
                  borderRadius="$4"
                  padding={0}
                  onPress={() => {
                    setType(SignerType.NFC);
                    setAddress(x.account.createKey);
                    setMint(
                      x.account.label
                        ? new PublicKey(x.account.label)
                        : undefined
                    );
                  }}
                >
                  <Image
                    borderRadius={"$4"}
                    height={"100%"}
                    width={"100%"}
                    objectFit="contain"
                    source={{ uri: x?.data?.content?.links?.image }}
                    alt="image"
                  />
                </Button>
              );
            })}
          </YStack>
        </YStack>
        <WalletSheets type={type} address={address} reset={reset} mint={mint} />
      </YStack>
    </ScreenWrapper>
  );
};
