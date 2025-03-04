import {
  Check,
  FileKey2,
  Import,
  Smartphone,
  WalletCards,
} from "@tamagui/lucide-icons";
import { CustomButton } from "components/ui/CustomButton";
import { Header } from "components/wallet/header";
import { FC, useEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";
import {
  ButtonText,
  Heading,
  Input,
  ListItem,
  Spinner,
  Text,
  TextArea,
  YStack,
} from "tamagui";
import { useGenerateWallet, useGlobalStore, WalletType } from "utils";

export const Onboarding: FC = () => {
  const {
    expoPushToken,
    deviceWalletPublicKey,
    paymasterWalletPublicKey,
    setPaymasterWalletPublicKey,
    setDeviceWalletPublicKey,
  } = useGlobalStore();
  const generateWalletMutation = useGenerateWallet({
    expoPushToken,
    setPaymasterWalletPublicKey,
    setDeviceWalletPublicKey,
  });
  const [mnemonic, setMnemonic] = useState("");
  const [username, setUsername] = useState("");
  const [step, setStep] = useState(1);
  const [currentWalletType, setCurrentWalletType] = useState(WalletType.DEVICE);

  useEffect(() => {
    if (step !== 1) return;
    if (deviceWalletPublicKey && !paymasterWalletPublicKey) {
      setCurrentWalletType(WalletType.PAYMASTER);
    } else {
      setCurrentWalletType(WalletType.DEVICE);
    }
  }, [deviceWalletPublicKey, paymasterWalletPublicKey, step]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {step === 1 && (
        <YStack items="center" gap={"$6"}>
          <Heading size={"$5"} text="center" p="$4">
            Welcome to Your Wallet Setup
          </Heading>
          <WalletCards size="$14" />
          <Text text="center" fontSize="$6">
            {"Let's set up your wallets."}
          </Text>
          <YStack width={"80%"} gap={"$4"}>
            <ListItem
              borderTopLeftRadius={"$4"}
              borderTopRightRadius={"$4"}
              borderBottomLeftRadius={"$4"}
              borderBottomRightRadius={"$4"}
              theme={deviceWalletPublicKey ? "green" : null}
              bordered={currentWalletType === WalletType.DEVICE ? 1 : 0}
              onPress={() => setCurrentWalletType(WalletType.DEVICE)}
              icon={<Smartphone size={"$1"} />}
              title={"Device Wallet"}
              subTitle={deviceWalletPublicKey}
              iconAfter={deviceWalletPublicKey ? <Check size={"$1"} /> : <></>}
            />
            <ListItem
              borderTopLeftRadius={"$4"}
              borderTopRightRadius={"$4"}
              borderBottomLeftRadius={"$4"}
              borderBottomRightRadius={"$4"}
              theme={paymasterWalletPublicKey ? "green" : null}
              bordered={currentWalletType === WalletType.PAYMASTER ? 1 : 0}
              onPress={() => setCurrentWalletType(WalletType.PAYMASTER)}
              icon={<FileKey2 size={"$1"} />}
              title={"Paymaster Wallet"}
              subTitle={paymasterWalletPublicKey}
              iconAfter={
                paymasterWalletPublicKey ? <Check size={"$1"} /> : <></>
              }
            />
          </YStack>
          <CustomButton onPress={() => setStep(2)}>
            <ButtonText width="80%" text="center">
              Continue
            </ButtonText>
          </CustomButton>
        </YStack>
      )}
      {step === 2 && (
        <YStack
          enterStyle={{ opacity: 0, x: -25 }}
          animation={"quick"}
          items="center"
          gap={"$6"}
        >
          <Header
            text={
              currentWalletType === WalletType.DEVICE
                ? "Set Up a Device Wallet"
                : "Set Up a Paymaster Wallet"
            }
            reset={() => setStep(1)}
            props={{ py: "$4" }}
          />

          <YStack gap="$4" px={"$4"} items="center">
            {currentWalletType === WalletType.DEVICE ? (
              <>
                <Smartphone size={"$14"} />
                <Text text="center" fontSize={"$6"}>
                  {`The wallet's private key will be securely stored on your device and is protected by your biometrics.`}
                </Text>
                <Text text="center" fontSize={"$6"}>
                  {`Create a new wallet or use an existing seed phrase to set up your wallet.`}
                </Text>
                <YStack gap={"$1"}>
                  <CustomButton
                    onPress={() =>
                      generateWalletMutation.mutateAsync({
                        walletType: currentWalletType,
                        callback: () => {
                          setStep(1);
                        },
                      })
                    }
                  >
                    {generateWalletMutation.isPending && <Spinner />}
                    <ButtonText text="center">Create Wallet</ButtonText>
                  </CustomButton>
                  <CustomButton
                    onPress={() => setStep(3)}
                    variant="outlined"
                    borderWidth={"$0"}
                  >
                    <ButtonText>Use an Existing Seed Phrase</ButtonText>
                  </CustomButton>
                </YStack>
              </>
            ) : (
              <>
                <FileKey2 size={"$14"} />
                <Text text="center" fontSize={"$6"}>
                  {`Paymaster is a custodial wallet with vote-only permissions in a multisig, mainly used to cover network fees.`}
                </Text>
                <Text text="center" fontSize={"$6"}>
                  {`Sign in with an existing passkey or create an account to set up the wallet.`}
                </Text>
                <YStack gap={"$1"}>
                  <CustomButton
                    onPress={() => {
                      generateWalletMutation.mutateAsync({
                        walletType: currentWalletType,
                        register: false,
                        callback: () => {
                          setStep(1);
                        },
                      });
                    }}
                  >
                    {generateWalletMutation.isPending && <Spinner />}
                    <ButtonText>Sign In With Passkey</ButtonText>
                  </CustomButton>
                  <CustomButton
                    onPress={() => setStep(4)}
                    variant="outlined"
                    borderWidth={"$0"}
                  >
                    <ButtonText>Create an Account</ButtonText>
                  </CustomButton>
                </YStack>
              </>
            )}
          </YStack>
        </YStack>
      )}
      {step == 3 && (
        <YStack
          enterStyle={{ opacity: 0, x: -25 }}
          animation={"quick"}
          items="center"
          gap={"$6"}
        >
          <Header
            props={{ py: "$4" }}
            text={"Import an Existing Wallet"}
            reset={() => {
              setStep(2);
              setMnemonic("");
            }}
          />
          <Import size={"$14"} />
          <TextArea
            minH={120}
            autoCorrect={false}
            inputMode="text"
            width={"100%"}
            value={mnemonic}
            onChangeText={setMnemonic}
            placeholder={`Enter the 12 word seed phrase to import your wallet`}
          />
          <YStack gap={"$2"} width={"80%"}>
            <CustomButton
              onPress={() => {
                let normalizedMnemonic = mnemonic
                  .split(" ")
                  .filter((word) => word.trim() !== "")
                  .join(" ");
                if (normalizedMnemonic.split(" ").length !== 24) {
                  Alert.alert(
                    "Invalid Seed Phrase",
                    "Make sure your seed phrase contains exactly 24 words"
                  );
                  return;
                }
                generateWalletMutation.mutateAsync({
                  walletType: currentWalletType,
                  mnemonic: normalizedMnemonic,
                  callback: () => {
                    setMnemonic("");
                    setStep(1);
                  },
                });
              }}
            >
              {generateWalletMutation.isPending && <Spinner />}
              <ButtonText text="center">Import Wallet</ButtonText>
            </CustomButton>
          </YStack>
        </YStack>
      )}
      {step == 4 && (
        <YStack
          enterStyle={{ opacity: 0, x: -25 }}
          animation={"quick"}
          items="center"
          gap={"$6"}
        >
          <Header
            props={{ py: "$4" }}
            text={"Create an Account"}
            reset={() => {
              setStep(2);
              setUsername("");
            }}
          />
          <FileKey2 size={"$14"} />
          <Text text="center" fontSize={"$6"}>
            Give your passkey a unique name so you can easily recognize it
            later.
          </Text>
          <YStack gap={"$4"} width={"80%"} items={"center"}>
            <Input
              autoCorrect={false}
              inputMode="text"
              width={"100%"}
              value={username}
              onChangeText={setUsername}
              placeholder={`Enter a unique name`}
            />
            <CustomButton
              onPress={() => {
                generateWalletMutation.mutateAsync({
                  walletType: currentWalletType,
                  username,
                  callback: () => {
                    setUsername("");
                    setStep(1);
                  },
                });
              }}
            >
              {generateWalletMutation.isPending && <Spinner />}
              <ButtonText text="center">Create With Passkey</ButtonText>
            </CustomButton>
          </YStack>
        </YStack>
      )}
    </ScrollView>
  );
};
