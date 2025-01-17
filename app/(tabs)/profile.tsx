import { PublicKey } from "@solana/web3.js";
import {
  Check,
  CheckCircle2,
  Cloud,
  Import,
  Smartphone,
  WalletCards,
} from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { CustomListItem } from "components/CustomListItem";
import { useWallets } from "components/hooks/useWallets";
import { Google } from "components/icons/google";
import { useGlobalVariables } from "components/providers/globalProvider";
import { Header } from "components/wallet/header";
import { WalletSheets } from "components/wallet/sheets";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ButtonIcon,
  ButtonText,
  Card,
  Circle,
  Heading,
  Image,
  ListItem,
  ScrollView,
  Spinner,
  Text,
  TextArea,
  ThemeName,
  useTheme,
  useWindowDimensions,
  XStack,
  YStack,
} from "tamagui";
import { PLACEHOLDER_IMAGE } from "utils/consts";
import { WalletType } from "utils/enums/wallet";
import { formatAmount, getTotalValueFromWallet } from "utils/helper";
import { useGenerateWallet } from "utils/mutations/generateWallet";
import { useGetAssetsByOwner } from "utils/queries/useGetAssetsByOwner";
import { useGetMultisigByOwner } from "utils/queries/useGetMultisigByOwner";

export default function profile() {
  const {
    deviceWalletPublicKey,
    cloudWalletPublicKey,
    deviceWalletIsLoading,
    cloudWalletIsLoading,
  } = useWallets();

  const { top } = useSafeAreaInsets();
  return (
    <YStack
      flex={1}
      paddingTop={top}
      paddingHorizontal={"$4"}
      paddingBottom={"$4"}
    >
      {deviceWalletIsLoading || cloudWalletIsLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner />
          <Text>Loading...</Text>
        </YStack>
      ) : !deviceWalletPublicKey || !cloudWalletPublicKey ? (
        <Onboarding />
      ) : (
        <Profile />
      )}
    </YStack>
  );
}

const Profile: FC<{}> = () => {
  const { data: multiWallets } = useGetMultisigByOwner({});

  const [walletDetails, setWalletDetails] = useState<{
    address: PublicKey | null | undefined;
    mint: PublicKey | null;
    type: WalletType;
  }>({
    address: null,
    mint: null,
    type: WalletType.MULTIWALLET,
  });

  const reset = () =>
    setWalletDetails({
      address: null,
      mint: null,
      type: WalletType.MULTIWALLET,
    });

  return (
    <ScrollView
      contentContainerStyle={{ gap: 16, paddingTop: 16 }}
      flex={1}
      showsVerticalScrollIndicator={false}
    >
      <Heading size={"$6"}>Your Wallets</Heading>
      <WalletScrollView setWalletDetails={setWalletDetails} />
      <YStack width={"100%"} gap="$2">
        <Heading size={"$6"}>Collectible Wallets</Heading>
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
                  setWalletDetails({
                    address: new PublicKey(x.createKey),
                    type: WalletType.MULTIWALLET,
                    mint: x.metadata ? new PublicKey(x.metadata) : null,
                  });
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
                    {`${x.totalValue.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 5,
                    })}`}
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
                  paddingHorizontal={"$3"}
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
      <WalletSheets
        type={walletDetails.type}
        address={walletDetails.address}
        reset={reset}
        mint={walletDetails.mint}
      />
    </ScrollView>
  );
};

const WalletScrollView: FC<{
  setWalletDetails: (
    value: React.SetStateAction<{
      address: PublicKey | null | undefined;
      mint: PublicKey | null;
      type: WalletType;
    }>
  ) => void;
}> = ({ setWalletDetails }) => {
  const {
    deviceWalletPublicKey,
    cloudWalletPublicKey,
    defaultWallet,
    setDefaultWallet,
  } = useWallets();

  const { data: deviceWalletAssets } = useGetAssetsByOwner({
    address: deviceWalletPublicKey,
  });

  const { data: cloudWalletAssets } = useGetAssetsByOwner({
    address: cloudWalletPublicKey,
  });
  const wallets = useMemo(
    () => [
      {
        subtitle: "Device Wallet",
        publicKey: deviceWalletPublicKey,
        theme: "blue" as ThemeName,
        type: WalletType.DEVICE,
        icon: <Smartphone size={"$1.5"} />,
        amount: deviceWalletAssets
          ? getTotalValueFromWallet(deviceWalletAssets)
          : 0,
      },
      {
        subtitle: "Cloud Wallet",
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
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const handleScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    // Determine the direction of swipe
    const direction = offsetX - activePage * width > 0 ? 1 : -1;

    // Introduce a threshold for easier swiping
    const threshold = 15; // Adjust for sensitivity

    // Check if the swipe passes the threshold
    const delta = offsetX - activePage * width;

    const snappedPage =
      Math.abs(delta) > threshold ? activePage + direction : activePage;

    // Prevent going out of bounds
    const boundedSnappedPage = Math.max(0, snappedPage);

    setActivePage(boundedSnappedPage);

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: snappedPage * width,
        animated: true,
      });
    }
  };
  return (
    <YStack width={"100%"}>
      <ScrollView
        ref={scrollViewRef}
        snapToAlignment="center"
        contentContainerStyle={{ width: width * 2 - 36, gap: 36 }}
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
              borderRadius={"$4"}
              bordered
              padded
              theme={theme}
              title={`$${formatAmount(amount)}`}
              onPress={() => {
                if (publicKey) {
                  setWalletDetails({
                    address: publicKey,
                    type,
                    mint: null,
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
                    {defaultWallet?.toString() === publicKey?.toString()
                      ? "Default Wallet"
                      : "Set as Default Wallet"}
                  </ButtonText>
                  {defaultWallet?.toString() === publicKey?.toString() && (
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
      <XStack justifyContent="center" alignItems="center" marginTop="$2">
        {wallets.map((_, index) => (
          <Circle
            key={index}
            size={8}
            backgroundColor={activePage === index ? "$blue10" : "$gray5"}
            marginHorizontal="$1"
          />
        ))}
      </XStack>
    </YStack>
  );
};

const Onboarding: FC = () => {
  const { cloudStorage, handleSignInWithGoogle } = useGlobalVariables();
  const { deviceWalletPublicKey, cloudWalletPublicKey } = useWallets();
  const generateWalletMutation = useGenerateWallet();
  const [mnemonic, setMnemonic] = useState("");
  const [step, setStep] = useState(1);
  const [currentWalletType, setCurrentWalletType] = useState(WalletType.DEVICE);
  const [isCloudAvailable, setIsCloudAvailable] = useState(false);
  const { color } = useTheme();
  useEffect(() => {
    if (cloudStorage) {
      cloudStorage
        .isCloudAvailable()
        .then((result) => setIsCloudAvailable(result));
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

  const renderStep = useMemo(() => {
    switch (step) {
      case 1:
        return (
          <>
            <Heading textAlign="center" padding="$4">
              Welcome to Your Wallet Setup
            </Heading>
            <WalletCards size="$14" />
            <Text textAlign="center" fontSize="$6">
              {
                "Let's set up your wallets.\nA device wallet for daily transactions and a cloud wallet for easy recovery."
              }
            </Text>
            <YStack width={"80%"} gap={"$4"}>
              <ListItem
                theme={deviceWalletPublicKey ? "green" : "active"}
                bordered={currentWalletType === WalletType.DEVICE ? 1 : 0}
                borderColor={color.val}
                onPress={() => setCurrentWalletType(WalletType.DEVICE)}
                borderRadius={"$4"}
                icon={<Smartphone size={"$1"} />}
                title={"Device Wallet"}
                subTitle={deviceWalletPublicKey?.toString()}
                iconAfter={
                  deviceWalletPublicKey ? <Check size={"$1"} /> : <></>
                }
              />
              <ListItem
                theme={cloudWalletPublicKey ? "green" : "active"}
                bordered={currentWalletType === WalletType.CLOUD ? 1 : 0}
                borderColor={color.val}
                onPress={() => setCurrentWalletType(WalletType.CLOUD)}
                borderRadius={"$4"}
                icon={<Cloud size={"$1"} />}
                title={"Cloud Wallet"}
                subTitle={cloudWalletPublicKey?.toString()}
                iconAfter={cloudWalletPublicKey ? <Check size={"$1"} /> : <></>}
              />
            </YStack>
            <CustomButton theme="active" onPress={() => setStep(2)}>
              <ButtonText width="80%" textAlign="center">
                Continue
              </ButtonText>
            </CustomButton>
          </>
        );
      case 2:
        return (
          <>
            <Header
              paddingVertical={"$4"}
              text={
                currentWalletType === WalletType.DEVICE
                  ? "Set Up a Device Wallet"
                  : "Set Up a Cloud Wallet"
              }
              reset={() => setStep(1)}
            />

            {currentWalletType === WalletType.DEVICE ? (
              <Smartphone size={"$14"} />
            ) : (
              <Cloud size={"$14"} />
            )}
            <Text textAlign="center" fontSize={"$6"}>
              {currentWalletType === WalletType.DEVICE
                ? `The wallet's private key will be securely stored on your device and is protected by your biometrics.`
                : !isCloudAvailable
                ? "Sign in with your Google account to securely store your private keys in your Google Drive."
                : "Your wallet's private key is securely stored in your personal iCloud or Google Drive and is accessible only with your biometrics."}
            </Text>
            {((currentWalletType === WalletType.CLOUD && isCloudAvailable) ||
              currentWalletType === WalletType.DEVICE) && (
              <Text textAlign="center" fontSize={"$6"}>
                {`Create a new wallet or use an existing seed phrase to set up your wallet.`}
              </Text>
            )}
            <YStack gap="$3" width="80%" alignItems="center">
              {(currentWalletType === WalletType.CLOUD && isCloudAvailable) ||
              currentWalletType === WalletType.DEVICE ? (
                <>
                  <CustomButton
                    theme={"active"}
                    width={"100%"}
                    onPress={async () => {
                      const result = await generateWalletMutation.mutateAsync({
                        walletType: currentWalletType,
                      });
                      if (result) {
                        setStep(1);
                      }
                    }}
                  >
                    {generateWalletMutation.isPending && <Spinner />}
                    <ButtonText textAlign="center">Create Wallet</ButtonText>
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
                <CustomButton theme={"active"} onPress={handleSignInWithGoogle}>
                  <ButtonIcon children={<Google />} />
                  <ButtonText>Sign In With Google</ButtonText>
                </CustomButton>
              )}
            </YStack>
          </>
        );
      case 3:
        return (
          <>
            <Header
              paddingVertical={"$4"}
              text={"Import an Existing Wallet"}
              reset={() => setStep(2)}
            />
            <Import size={"$14"} />
            <TextArea
              minHeight={120}
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
                onPress={async () => {
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
                  await generateWalletMutation.mutateAsync({
                    walletType: currentWalletType,
                    mnemonic: normalizedMnemonic,
                  });
                  setMnemonic("");
                  setStep(1);
                }}
              >
                {generateWalletMutation.isPending && <Spinner />}
                <ButtonText textAlign="center">Import Wallet</ButtonText>
              </CustomButton>
            </YStack>
          </>
        );
      default:
        return <></>;
    }
  }, [mnemonic, setMnemonic, step, setStep, generateWalletMutation]);
  return (
    <ScrollView>
      <YStack alignItems="center" flex={1} gap={"$6"}>
        {renderStep}
      </YStack>
    </ScrollView>
  );
};
