import { DAS } from "@revibase/token-transfer";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Cloud,
  Import,
  Smartphone,
  WalletCards,
} from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { CustomCard } from "components/CustomCard";
import { CustomListItem } from "components/CustomListItem";
import { useInit } from "components/hooks";
import { useAssetValidation } from "components/hooks/useAssetValidation";
import { useGetMultiWallets } from "components/hooks/useGetMultiWallets";
import { Google } from "components/icons/google";
import { Header } from "components/wallet/header";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ButtonIcon,
  ButtonText,
  Circle,
  Heading,
  ListItem,
  ScrollView,
  Spinner,
  Text,
  TextArea,
  ThemeName,
  useWindowDimensions,
  XStack,
  YStack,
} from "tamagui";
import {
  formatAmount,
  getTotalValueFromWallet,
  PLACEHOLDER_IMAGE,
  useGenerateWallet,
  useGetAssetsByOwner,
  useGlobalStore,
  WalletType,
} from "utils";
export default function profile() {
  const {
    deviceWalletPublicKey,
    cloudWalletPublicKey,
    isHydrated,
    cloudStorage,
  } = useGlobalStore();
  const { top } = useSafeAreaInsets();

  return (
    <YStack flex={1} pt={top} px={"$3"} pb={"$4"}>
      {!isHydrated ? (
        <YStack flex={1} items="center" justify="center">
          <Spinner />
          <Text>Loading...</Text>
        </YStack>
      ) : !deviceWalletPublicKey || !cloudStorage || !cloudWalletPublicKey ? (
        <Onboarding />
      ) : (
        <Profile />
      )}
    </YStack>
  );
}

const Profile: FC<{}> = () => {
  const { setWalletSheetArgs } = useGlobalStore();
  const [parentWidth, setParentWidth] = useState(0);
  const { hasAsset } = useAssetValidation();
  const { multiWallets } = useGetMultiWallets();
  const { height } = useWindowDimensions();
  return (
    <ScrollView
      contentContainerStyle={{ gap: 16, pt: 16, pb: Math.round(height * 0.15) }}
      flex={1}
      showsVerticalScrollIndicator={false}
    >
      <Heading size={"$5"}>Your Wallets</Heading>
      <WalletScrollView />
      <YStack width={"100%"} gap="$2">
        <Heading size={"$3"}>Collectible Wallets</Heading>
        <YStack
          width={"100%"}
          onLayout={(event) => setParentWidth(event.nativeEvent.layout.width)}
          flexWrap="wrap"
          flexDirection="row"
          gap={16}
        >
          {parentWidth > 0 &&
            multiWallets?.map((x) => {
              const parsedMetadata = x.fullMetadata
                ? (JSON.parse(x.fullMetadata) as DAS.GetAssetResponse)
                : undefined;
              return (
                <YStack
                  key={x.createKey}
                  width={(parentWidth - 32) / 3}
                  height={(parentWidth - 32) / 3}
                  gap={"$2"}
                  justify="space-between"
                  items="center"
                  bg={"$colorTransparent"}
                  hoverStyle={{ scale: 0.925 }}
                  pressStyle={{ scale: 0.875 }}
                  animation="bouncy"
                  onPress={() => {
                    setWalletSheetArgs({
                      walletAddress: x.createKey,
                      type: WalletType.MULTIWALLET,
                      mint: x.metadata || null,
                      theme: "accent",
                    });
                  }}
                >
                  <XStack
                    maxW={"80%"}
                    px={"$2"}
                    justify="center"
                    items="baseline"
                    gap={"$1"}
                  >
                    <Text fontSize={"$1"}>USD</Text>
                    <Text numberOfLines={1} fontSize={"$5"} fontWeight={"800"}>
                      {`${formatAmount(x.totalValue)}`}
                    </Text>
                  </XStack>
                  <CustomCard
                    height={"$8"}
                    url={
                      x.data?.content?.links?.image ||
                      parsedMetadata?.content?.links?.image ||
                      PLACEHOLDER_IMAGE
                    }
                  />
                  <XStack
                    maxW={"80%"}
                    px={"$2"}
                    justify={"center"}
                    gap={"$2"}
                    items={"center"}
                  >
                    {x.metadata &&
                      !hasAsset(
                        x.data,
                        x.vaultAddress,
                        false,
                        true,
                        true,
                        WalletType.MULTIWALLET
                      ) && <AlertCircle size={"$1"} color={"red"} />}
                    <Text numberOfLines={1} fontSize={"$3"}>
                      {x.data?.content?.metadata.name ||
                        parsedMetadata?.content?.metadata?.name ||
                        x.vaultAddress}
                    </Text>
                  </XStack>
                </YStack>
              );
            })}
        </YStack>
      </YStack>
    </ScrollView>
  );
};

const WalletScrollView: FC = () => {
  const {
    deviceWalletPublicKey,
    cloudWalletPublicKey,
    setWalletSheetArgs,
    defaultWallet,
    setDefaultWallet,
  } = useGlobalStore();
  const { data: deviceWalletAssets } = useGetAssetsByOwner({
    address: deviceWalletPublicKey,
  });

  const { data: cloudWalletAssets } = useGetAssetsByOwner({
    address: cloudWalletPublicKey,
  });
  const wallets = useMemo(
    () => [
      {
        subtitle: WalletType.DEVICE,
        publicKey: deviceWalletPublicKey,
        theme: "blue" as ThemeName,
        type: WalletType.DEVICE,
        icon: <Smartphone size={"$1.5"} />,
        amount: deviceWalletAssets
          ? getTotalValueFromWallet(deviceWalletAssets)
          : 0,
      },
      {
        subtitle: WalletType.CLOUD,
        publicKey: cloudWalletPublicKey,
        theme: "green" as ThemeName,
        type: WalletType.CLOUD,
        icon: <Cloud size={"$1.5"} />,
        amount: cloudWalletAssets
          ? getTotalValueFromWallet(cloudWalletAssets)
          : 0,
      },
    ],
    [
      deviceWalletAssets,
      cloudWalletAssets,
      deviceWalletPublicKey,
      cloudWalletPublicKey,
    ]
  );

  const [activePage, setActivePage] = useState(0);
  const [parentWidth, setParentWidth] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const handleScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    // Determine the direction of swipe
    const direction = offsetX - activePage * parentWidth > 0 ? 1 : -1;

    // Introduce a threshold for easier swiping
    const threshold = 15; // Adjust for sensitivity

    // Check if the swipe passes the threshold
    const delta = offsetX - activePage * parentWidth;

    const snappedPage =
      Math.abs(delta) > threshold ? activePage + direction : activePage;

    // Prevent going out of bounds
    const boundedSnappedPage = Math.min(Math.max(0, snappedPage), 1);

    setActivePage(boundedSnappedPage);

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: snappedPage * parentWidth,
        animated: true,
      });
    }
  };
  return (
    <YStack
      width={"100%"}
      onLayout={(event) => setParentWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={scrollViewRef}
        snapToAlignment="center"
        contentContainerStyle={{ width: parentWidth * 2 }}
        horizontal={true}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        disableIntervalMomentum={true}
      >
        {wallets.map(
          ({ amount, subtitle, publicKey, theme, type, icon }, index) => (
            <CustomListItem
              key={index}
              bordered
              borderTopEndRadius={"$2"}
              borderTopStartRadius={"$2"}
              borderBottomEndRadius={"$2"}
              borderBottomStartRadius={"$2"}
              padded
              theme={theme}
              title={`$${formatAmount(amount)}`}
              onPress={() => {
                if (publicKey) {
                  setWalletSheetArgs({
                    walletAddress: publicKey,
                    type,
                    mint: null,
                    theme,
                  });
                }
              }}
              subTitle={subtitle}
              icon={icon}
              iconAfter={
                <CustomButton
                  onPress={() => {
                    setDefaultWallet(publicKey);
                  }}
                  size={"$3"}
                >
                  <ButtonText>
                    {defaultWallet == publicKey
                      ? "Default Wallet"
                      : "Set as Default Wallet"}
                  </ButtonText>
                  {defaultWallet == publicKey && (
                    <ButtonIcon>
                      <CheckCircle2 size={"$1"} />
                    </ButtonIcon>
                  )}
                </CustomButton>
              }
              disabled={!publicKey}
            />
          )
        )}
      </ScrollView>
      <XStack justify="center" items="center" mt="$2">
        {wallets.map((_, index) => (
          <Circle
            key={index}
            size={8}
            bg={activePage === index ? "$accent1" : "gray"}
            mx="$1"
          />
        ))}
      </XStack>
    </YStack>
  );
};

const Onboarding: FC = () => {
  const {
    expoPushToken,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
    setCloudWalletPublicKey,
    setDeviceWalletPublicKey,
    cloudStorage,
  } = useGlobalStore();
  const generateWalletMutation = useGenerateWallet({
    expoPushToken,
    cloudStorage,
    setCloudWalletPublicKey,
    setDeviceWalletPublicKey,
  });
  const [mnemonic, setMnemonic] = useState("");
  const [step, setStep] = useState(1);
  const [currentWalletType, setCurrentWalletType] = useState(WalletType.DEVICE);
  const [isCloudAvailable, setIsCloudAvailable] = useState(false);
  const { handleSignInWithGoogle } = useInit();
  useEffect(() => {
    if (cloudStorage) {
      cloudStorage.isCloudAvailable().then(setIsCloudAvailable);
    }
  }, [cloudStorage]);

  useEffect(() => {
    if (step !== 1) return;
    if (deviceWalletPublicKey && !cloudWalletPublicKey) {
      setCurrentWalletType(WalletType.CLOUD);
    } else {
      setCurrentWalletType(WalletType.DEVICE);
    }
  }, [deviceWalletPublicKey, cloudWalletPublicKey, step]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {step === 1 && (
        <YStack items="center" gap={"$6"}>
          <Heading size={"$5"} text="center" p="$4">
            Welcome to Your Wallet Setup
          </Heading>
          <WalletCards size="$14" />
          <Text text="center" fontSize="$6">
            {
              "Let's set up your wallets.\nA device wallet for daily transactions and a cloud wallet for easy recovery."
            }
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
              theme={cloudWalletPublicKey ? "green" : null}
              bordered={currentWalletType === WalletType.CLOUD ? 1 : 0}
              onPress={() => setCurrentWalletType(WalletType.CLOUD)}
              icon={<Cloud size={"$1"} />}
              title={"Cloud Wallet"}
              subTitle={cloudWalletPublicKey}
              iconAfter={cloudWalletPublicKey ? <Check size={"$1"} /> : <></>}
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
                : "Set Up a Cloud Wallet"
            }
            reset={() => setStep(1)}
            props={{ py: "$4" }}
          />

          {currentWalletType === WalletType.DEVICE ? (
            <Smartphone size={"$14"} />
          ) : (
            <Cloud size={"$14"} />
          )}
          <Text text="center" fontSize={"$6"}>
            {currentWalletType === WalletType.DEVICE
              ? `The wallet's private key will be securely stored on your device and is protected by your biometrics.`
              : !isCloudAvailable
              ? "Sign in with your Google account to securely store your private keys in your Google Drive."
              : "Your wallet's private key is securely stored in your personal iCloud or Google Drive and is accessible only with your biometrics."}
          </Text>
          {((currentWalletType === WalletType.CLOUD && isCloudAvailable) ||
            currentWalletType === WalletType.DEVICE) && (
            <Text text="center" fontSize={"$6"}>
              {`Create a new wallet or use an existing seed phrase to set up your wallet.`}
            </Text>
          )}
          <YStack gap="$3" width="80%" items="center">
            {(currentWalletType === WalletType.CLOUD && isCloudAvailable) ||
            currentWalletType === WalletType.DEVICE ? (
              <>
                <CustomButton
                  width={"100%"}
                  onPress={() => {
                    generateWalletMutation.mutateAsync({
                      walletType: currentWalletType,
                      callback: () => {
                        setStep(1);
                      },
                    });
                  }}
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
              </>
            ) : (
              <CustomButton onPress={handleSignInWithGoogle}>
                <ButtonIcon children={<Google />} />
                <ButtonText>Sign In With Google</ButtonText>
              </CustomButton>
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
            reset={() => setStep(2)}
          />
          <Import size={"$14"} />
          <TextArea
            minH={120}
            autoCorrect={false}
            inputMode="text"
            width={"100%"}
            value={mnemonic}
            onChangeText={setMnemonic}
            placeholder={`Enter the 24 word seed phrase to import your wallet`}
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
    </ScrollView>
  );
};
