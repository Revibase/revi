import { initiateEscrowAsNonOwner } from "@revibase/multi-wallet";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Copy, Edit3, Trash2, User, UserPlus } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { CustomListItem } from "components/CustomListItem";
import { useCopyToClipboard, useWallet, useWalletInfo } from "components/hooks";
import { useConnection } from "components/providers/connectionProvider";
import { router } from "expo-router";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  ButtonIcon,
  ButtonText,
  Heading,
  Input,
  Label,
  Spinner,
  Text,
  XStack,
  YGroup,
  YStack,
} from "tamagui";
import {
  getPermissionsFromSignerType,
  getRandomU64,
  getSignerTypeFromAddress,
  getSponsoredFeePayer,
  logError,
  Page,
  SignerState,
  SignerType,
  TransactionSigner,
  useGlobalStore,
} from "utils";
import { ScreenWrapper } from "../screenWrapper";
import { RenderWalletInfo } from "./walletInfo";

export const RenderWalletMembers: FC = () => {
  const {
    setPage,
    walletSheetArgs,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
  } = useGlobalStore();
  const { walletAddress, type } = walletSheetArgs ?? {};

  const { walletInfo } = useWalletInfo({ type, walletAddress });

  const [offer, setOffer] = useState(false);
  const [edit, setEdit] = useState(false);
  const [add, setAdd] = useState(false);

  const [filteredMembers, setFilteredMembers] = useState<TransactionSigner[]>(
    []
  );
  const originalMembers = useMemo(() => {
    return (
      walletInfo?.members.map((x) => ({
        key: x.pubkey,
        type: getSignerTypeFromAddress(
          {
            pubkey: x.pubkey,
            createKey: walletInfo.createKey,
          },
          deviceWalletPublicKey,
          cloudWalletPublicKey
        ),
        state: SignerState.Unsigned,
      })) || []
    );
  }, [walletInfo?.members, deviceWalletPublicKey, cloudWalletPublicKey]);

  useEffect(() => {
    setFilteredMembers(originalMembers);
  }, [originalMembers]);

  if (offer) {
    return (
      <ScreenWrapper text="Make an Offer" reset={() => setPage(Page.Main)}>
        <YStack gap={"$4"}>
          <RenderOffer setOffer={setOffer} />
        </YStack>
      </ScreenWrapper>
    );
  }

  if (add) {
    return (
      <ScreenWrapper text="Add Member" reset={() => setPage(Page.Main)}>
        <YStack gap={"$4"}>
          <RenderAddMembers
            filteredMembers={filteredMembers}
            setFilteredMembers={setFilteredMembers}
            setAdd={setAdd}
          />
        </YStack>
      </ScreenWrapper>
    );
  }

  if (edit) {
    return (
      <ScreenWrapper text="Edit Members" reset={() => setPage(Page.Main)}>
        <YStack gap={"$4"}>
          <RenderEditMembers
            originalMembers={originalMembers}
            filteredMembers={filteredMembers}
            setEdit={setEdit}
            setFilteredMembers={setFilteredMembers}
            setAdd={setAdd}
          />
        </YStack>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper text="Wallet Details" reset={() => setPage(Page.Main)}>
      <YStack gap={"$4"}>
        <RenderWalletInfo />
        <RenderMembers
          filteredMembers={filteredMembers}
          setEdit={setEdit}
          setOffer={setOffer}
        />
      </YStack>
    </ScreenWrapper>
  );
};

const RenderOffer: FC<{
  setOffer: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ setOffer }) => {
  const {
    walletSheetArgs,
    setTransactionSheetArgs,
    defaultWallet,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
    setWalletSheetArgs,
    setPage,
  } = useGlobalStore();
  const { walletAddress, theme, type } = walletSheetArgs ?? {};
  const [amount, setAmount] = useState("");
  const reset = () => {
    setOffer(false);
    setAmount("");
  };
  const [loading, setLoading] = useState(false);
  const { connection } = useConnection();

  const { walletInfo } = useWalletInfo({ type, walletAddress });

  const handleConfirm = useCallback(async () => {
    try {
      if (
        !walletInfo ||
        !defaultWallet ||
        !deviceWalletPublicKey ||
        !cloudWalletPublicKey ||
        !walletAddress
      ) {
        setWalletSheetArgs(null);
        Alert.alert(
          "Wallet not found.",
          "You need to complete your wallet set up first."
        );
        router.replace("/(tabs)/profile");
        return;
      }
      setLoading(true);
      const newOwners = [
        {
          pubkey: walletAddress,
          permissions: getPermissionsFromSignerType(SignerType.NFC),
        },
        {
          pubkey: deviceWalletPublicKey,
          permissions: getPermissionsFromSignerType(SignerType.DEVICE),
        },
        {
          pubkey: cloudWalletPublicKey,
          permissions: getPermissionsFromSignerType(SignerType.CLOUD),
        },
      ];
      const proposer = {
        key: defaultWallet,
        state: SignerState.Unsigned,
        type: getSignerTypeFromAddress(
          { pubkey: defaultWallet },
          deviceWalletPublicKey,
          cloudWalletPublicKey
        ),
      };
      const member = {
        key: walletAddress,
        state: SignerState.Unsigned,
        type: SignerType.NFC,
      };

      const parsedAmount = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);
      if (parsedAmount < 0.001 * LAMPORTS_PER_SOL) {
        throw new Error("Amount needs to be greater than 0.001 SOL");
      }
      const proposerData = await connection.getAccountInfo(
        new PublicKey(proposer.key)
      );
      if (
        (proposerData?.lamports || 0) <
        parsedAmount + 0.003 * LAMPORTS_PER_SOL
      ) {
        throw new Error(
          `Insufficient SOL in ${proposer.type} Wallet to pay for fees.`
        );
      }
      const identifier = getRandomU64();
      const ix = await initiateEscrowAsNonOwner({
        amount: parsedAmount,
        identifier,
        walletAddress: new PublicKey(walletAddress),
        proposer: new PublicKey(proposer.key),
        newOwners: newOwners.map((x) => ({
          ...x,
          pubkey: new PublicKey(x.pubkey),
        })),
        threshold: newOwners.length > 1 ? 2 : 1,
        member: new PublicKey(member.key),
      });

      setTransactionSheetArgs({
        callback: (signature) => signature && setPage(Page.Main),
        feePayer: proposer.key,
        theme,
        walletAddress,
        signers: [member, proposer],
        ixs: [ix],
      });
    } catch (error) {
      logError(error);
      Alert.alert(
        "Unable to Send Offer",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setLoading(false);
    }
  }, [
    theme,
    connection,
    amount,
    walletInfo,
    walletAddress,
    defaultWallet,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
  ]);
  return (
    <>
      <XStack
        items="center"
        borderWidth={1}
        borderTopLeftRadius={"$4"}
        borderTopRightRadius={"$4"}
        borderBottomLeftRadius={"$4"}
        borderBottomRightRadius={"$4"}
        p={"$2"}
        borderColor={"gray"}
      >
        <Input
          id={"amount"}
          size={"$3"}
          inputMode="decimal"
          value={amount}
          onChangeText={setAmount}
          bg={"$colorTransparent"}
          borderWidth={"$0"}
          flex={1}
          placeholder={`Enter an amount (minimum 0.001 SOL)`}
        />
        <Label htmlFor="amount" px={"$2"}>
          SOL
        </Label>
      </XStack>
      <CustomButton onPress={handleConfirm}>
        {loading && <Spinner />}
        <ButtonText>{`Submit ${amount} Sol Offer`}</ButtonText>
      </CustomButton>
      <CustomButton
        onPress={() => {
          reset();
        }}
      >
        <ButtonText>{"Back"}</ButtonText>
      </CustomButton>
    </>
  );
};

const RenderAddMembers: FC<{
  filteredMembers: TransactionSigner[];
  setFilteredMembers: React.Dispatch<React.SetStateAction<TransactionSigner[]>>;
  setAdd: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ filteredMembers, setFilteredMembers, setAdd }) => {
  const { walletSheetArgs, deviceWalletPublicKey, cloudWalletPublicKey } =
    useGlobalStore();
  const { walletAddress } = walletSheetArgs ?? {};
  const [member, setMember] = useState("");

  const reset = () => {
    setAdd(false);
    setMember("");
  };

  const addMember = (
    key: string,
    type: SignerType,
    state: SignerState = SignerState.Unsigned
  ) => {
    setFilteredMembers((prev) => [
      ...prev.filter((x) => x.key !== key),
      { key, type, state },
    ]);
    reset();
  };

  const isMember = (key: string) => filteredMembers.some((x) => x.key === key);

  const renderListItem = (key: string, type: SignerType, title: string) => (
    <YGroup.Item>
      <CustomListItem
        onPress={() => addMember(key, type)}
        bordered
        icon={<User size={"$1"} />}
        title={title}
        subTitle={type}
      />
    </YGroup.Item>
  );

  const renderRecommendedMembers = () => {
    if (
      cloudWalletPublicKey &&
      deviceWalletPublicKey &&
      walletAddress &&
      (!isMember(deviceWalletPublicKey) ||
        !isMember(cloudWalletPublicKey) ||
        !isMember(walletAddress))
    ) {
      return (
        <>
          <Heading size={"$1"}>Use Recommended</Heading>
          <YGroup>
            {!isMember(walletAddress) &&
              renderListItem(
                walletAddress,
                SignerType.NFC,
                walletAddress.toString()
              )}
            {!isMember(deviceWalletPublicKey) &&
              renderListItem(
                deviceWalletPublicKey,
                SignerType.DEVICE,
                deviceWalletPublicKey.toString()
              )}
            {!isMember(cloudWalletPublicKey) &&
              renderListItem(
                cloudWalletPublicKey,
                SignerType.CLOUD,
                cloudWalletPublicKey.toString()
              )}
          </YGroup>
          <Heading size={"$1"} text="center">
            Or
          </Heading>
        </>
      );
    }
    return null;
  };

  const handleCustomAddressAdd = () => {
    try {
      new PublicKey(member);
      addMember(member, SignerType.UNKNOWN);
    } catch {
      Alert.alert("Invalid Publickey");
    }
  };

  return (
    <>
      {renderRecommendedMembers()}
      <Input
        size="$4"
        value={member}
        onChangeText={setMember}
        placeholder="Enter a custom wallet address"
      />
      <CustomButton onPress={handleCustomAddressAdd}>
        <ButtonText>{"Add Member"}</ButtonText>
      </CustomButton>
      <CustomButton onPress={reset}>
        <ButtonText>{"Back"}</ButtonText>
      </CustomButton>
    </>
  );
};

const RenderMembers: FC<{
  filteredMembers: TransactionSigner[];
  setOffer: React.Dispatch<React.SetStateAction<boolean>>;
  setEdit: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ filteredMembers, setOffer, setEdit }) => {
  const { walletSheetArgs, deviceWalletPublicKey, cloudWalletPublicKey } =
    useGlobalStore();
  const { walletAddress, theme, type } = walletSheetArgs ?? {};

  const copyToClipboard = useCopyToClipboard();

  const {
    walletInfo,
    noOwners,
    deviceWalletPublicKeyIsMember,
    cloudWalletPublicKeyIsMember,
    handleTakeOverAsOwner,
  } = useWallet({ theme, walletAddress, type });

  const handleConfirm = useCallback(async () => {
    if (deviceWalletPublicKeyIsMember || cloudWalletPublicKeyIsMember) {
      setEdit(true);
    } else if (
      deviceWalletPublicKey &&
      cloudWalletPublicKey &&
      !(noOwners && walletInfo && walletAddress)
    ) {
      setOffer(true);
    } else {
      handleTakeOverAsOwner();
    }
  }, [
    walletAddress,
    noOwners,
    deviceWalletPublicKeyIsMember,
    cloudWalletPublicKeyIsMember,
    walletInfo,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
  ]);

  return (
    <>
      <XStack justify="space-between" items="center" width={"99%"}>
        <Text>Members:</Text>
      </XStack>
      <YGroup self="center" size="$5">
        {filteredMembers.map((member, index) => {
          return (
            <YGroup.Item key={member.key}>
              <CustomListItem
                onPress={() => copyToClipboard(member.key)}
                bordered
                title={member.key}
                subTitle={`Member ${index + 1} ${
                  member.type === SignerType.UNKNOWN ? "" : `(${member.type})`
                }`}
                icon={<User size={"$1"} />}
                iconAfter={<Copy size={"$1"} />}
              />
            </YGroup.Item>
          );
        })}
      </YGroup>
      <CustomButton onPress={handleConfirm}>
        <ButtonText>
          {deviceWalletPublicKeyIsMember || cloudWalletPublicKeyIsMember
            ? "Edit Members"
            : noOwners
            ? "Claim Ownership"
            : "Make an Offer"}
        </ButtonText>
        {(deviceWalletPublicKeyIsMember || cloudWalletPublicKeyIsMember) && (
          <ButtonIcon>
            <Edit3 size={"$1"} />
          </ButtonIcon>
        )}
      </CustomButton>
    </>
  );
};

const RenderEditMembers: FC<{
  originalMembers: TransactionSigner[];
  setFilteredMembers: React.Dispatch<React.SetStateAction<TransactionSigner[]>>;
  setAdd: React.Dispatch<React.SetStateAction<boolean>>;
  filteredMembers: TransactionSigner[];
  setEdit: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  setAdd,
  filteredMembers,
  setFilteredMembers,
  setEdit,
  originalMembers,
}) => {
  const { walletSheetArgs, setTransactionSheetArgs, setPage } =
    useGlobalStore();
  const { walletAddress, theme, type } = walletSheetArgs ?? {};

  const { walletInfo } = useWalletInfo({ type, walletAddress });

  const handleConfirm = useCallback(async () => {
    const feePayer = getSponsoredFeePayer();
    if (walletInfo && walletAddress) {
      setTransactionSheetArgs({
        feePayer,
        theme,
        walletAddress,
        changeConfig: {
          newOwners: filteredMembers,
        },
        walletInfo,
        callback: (signature) =>
          signature ? setPage(Page.Main) : setPage(Page.Settings),
      });
    }
  }, [walletInfo, walletAddress, filteredMembers]);

  return (
    <>
      <XStack justify="space-between" items="center" width={"99%"}>
        <Text>Members:</Text>
        <CustomButton onPress={() => setAdd(true)} bordered size={"$3"}>
          <ButtonIcon>
            <UserPlus size={"$1"} />
          </ButtonIcon>
          <ButtonText>Add Member</ButtonText>
        </CustomButton>
      </XStack>
      <YGroup self="center" size="$5">
        {filteredMembers.map((member, index) => {
          return (
            <YGroup.Item key={member.key}>
              <CustomListItem
                bordered
                title={member.key}
                subTitle={`Member ${index + 1} (${member.type})`}
                onPress={() =>
                  setFilteredMembers((prev) =>
                    prev.filter((x) => x.key !== member.key)
                  )
                }
                icon={<User size={"$1"} />}
                iconAfter={<Trash2 size={"$1"} />}
              />
            </YGroup.Item>
          );
        })}
      </YGroup>
      <CustomButton onPress={handleConfirm}>
        <ButtonText>{"Continue"}</ButtonText>
      </CustomButton>
      <CustomButton
        onPress={() => {
          setEdit(false);
          setFilteredMembers(originalMembers);
        }}
      >
        <ButtonText>{"Cancel"}</ButtonText>
      </CustomButton>
    </>
  );
};
