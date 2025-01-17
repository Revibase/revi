import { PublicKey } from "@solana/web3.js";
import { Copy, Edit3, Trash2, User, UserPlus } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { CustomListItem } from "components/CustomListItem";
import { useCopyToClipboard } from "components/hooks/useCopyToClipboard";
import { useValidateWallet } from "components/hooks/useValidateWallet";
import { useWallets } from "components/hooks/useWallets";
import { router } from "expo-router";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  ButtonIcon,
  ButtonText,
  Heading,
  Input,
  Label,
  Text,
  XStack,
  YGroup,
} from "tamagui";
import { Page } from "utils/enums/page";
import { SignerType } from "utils/enums/transaction";
import { WalletType } from "utils/enums/wallet";
import { getMultiSigFromAddress, getSignerTypeFromAddress } from "utils/helper";
import { useInitiateEscrow } from "utils/mutations/initiateEscrow";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import {
  SignerState,
  TransactionArgs,
  TransactionSigner,
} from "utils/types/transaction";
import { Header } from "../header";
import { RenderWalletInfo } from "./walletInfo";

export const RenderWalletMembers: FC<{
  walletAddress: PublicKey;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  reset: () => void;
  closeSheet: () => void;
}> = ({ walletAddress, setArgs, setPage, reset, closeSheet }) => {
  const [filteredMembers, setFilteredMembers] = useState<TransactionSigner[]>(
    []
  );

  const [offer, setOffer] = useState(false);
  const [edit, setEdit] = useState(false);
  const [add, setAdd] = useState(false);

  if (offer) {
    return (
      <>
        <Header text={"Make an Offer"} reset={reset} />
        <RenderOffer
          walletAddress={walletAddress}
          setOffer={setOffer}
          setArgs={setArgs}
          setPage={setPage}
        />
      </>
    );
  }

  if (add) {
    return (
      <>
        <Header text={"Add Member"} reset={reset} />
        <RenderAddMembers
          walletAddress={walletAddress}
          filteredMembers={filteredMembers}
          setFilteredMembers={setFilteredMembers}
          setAdd={setAdd}
        />
      </>
    );
  }

  if (edit) {
    return (
      <>
        <Header text={"Edit Members"} reset={reset} />
        <RenderEditMembers
          filteredMembers={filteredMembers}
          walletAddress={walletAddress}
          setEdit={setEdit}
          setArgs={setArgs}
          setPage={setPage}
          reset={reset}
          setFilteredMembers={setFilteredMembers}
          setAdd={setAdd}
        />
      </>
    );
  }

  return (
    <>
      <Header text={"Wallet Details"} reset={reset} />
      <RenderWalletInfo
        type={WalletType.MULTIWALLET}
        walletAddress={walletAddress}
      />
      <RenderMembers
        setFilteredMembers={setFilteredMembers}
        filteredMembers={filteredMembers}
        walletAddress={walletAddress}
        setEdit={setEdit}
        setArgs={setArgs}
        setPage={setPage}
        setOffer={setOffer}
        closeSheet={closeSheet}
      />
    </>
  );
};

const RenderOffer: FC<{
  walletAddress: PublicKey;
  setOffer: React.Dispatch<React.SetStateAction<boolean>>;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
}> = ({ walletAddress, setOffer, setArgs, setPage }) => {
  const initiateEscrowMutation = useInitiateEscrow({ walletAddress });
  const [amount, setAmount] = useState("");
  const reset = () => {
    setOffer(false);
    setAmount("");
  };

  const handleConfirm = useCallback(async () => {
    const result = await initiateEscrowMutation.mutateAsync({
      amount,
    });
    if (result) {
      setArgs({
        signers: result.signers,
        ixs: [result.ix],
      });
      setPage(Page.Confirmation);
    }
  }, [amount]);
  return (
    <>
      <XStack
        alignItems="center"
        borderWidth={1}
        borderRadius={"$4"}
        padding={"$2"}
        borderColor={"$gray10"}
      >
        <Input
          id={"amount"}
          size={"$3"}
          inputMode="decimal"
          value={amount}
          onChangeText={setAmount}
          backgroundColor={"$colorTransparent"}
          borderWidth={"$0"}
          flex={1}
          placeholder={`Enter an amount (minimum 0.001 SOL)`}
        />
        <Label htmlFor="amount" paddingHorizontal={"$2"}>
          SOL
        </Label>
      </XStack>
      <CustomButton onPress={handleConfirm} themeInverse>
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
  walletAddress: PublicKey;
  filteredMembers: TransactionSigner[];
  setFilteredMembers: React.Dispatch<React.SetStateAction<TransactionSigner[]>>;
  setAdd: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ walletAddress, filteredMembers, setFilteredMembers, setAdd }) => {
  const { deviceWalletPublicKey, cloudWalletPublicKey } = useWallets();
  const [value, setValue] = useState("");

  const reset = () => {
    setAdd(false);
    setValue("");
  };

  const addMember = (
    key: PublicKey,
    type: SignerType,
    state: SignerState = SignerState.Unsigned
  ) => {
    setFilteredMembers((prev) => [
      ...prev.filter((x) => x.key.toString() !== key.toString()),
      { key, type, state },
    ]);
    reset();
  };

  const isMember = (key: PublicKey) =>
    filteredMembers.some((x) => x.key.toString() === key.toString());

  const renderListItem = (key: PublicKey, type: SignerType, title: string) => (
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
          <Heading size={"$1"} textAlign="center">
            Or
          </Heading>
        </>
      );
    }
    return null;
  };

  const handleCustomAddressAdd = () => {
    try {
      const newKey = new PublicKey(value);
      addMember(newKey, SignerType.UNKNOWN);
    } catch {
      Alert.alert("Invalid Publickey");
    }
  };

  return (
    <>
      {renderRecommendedMembers()}
      <Input
        size="$3"
        value={value}
        onChangeText={setValue}
        placeholder="Enter a custom wallet address"
      />
      <CustomButton onPress={handleCustomAddressAdd} themeInverse>
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
  setFilteredMembers: React.Dispatch<React.SetStateAction<TransactionSigner[]>>;
  walletAddress: PublicKey;
  setOffer: React.Dispatch<React.SetStateAction<boolean>>;
  setEdit: React.Dispatch<React.SetStateAction<boolean>>;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  closeSheet: () => void;
}> = ({
  filteredMembers,
  setFilteredMembers,
  walletAddress,
  setOffer,
  setEdit,
  setArgs,
  setPage,
  closeSheet,
}) => {
  const { deviceWalletPublicKey, cloudWalletPublicKey } = useWallets();
  const { data: walletInfo } = useGetWalletInfo({
    address: getMultiSigFromAddress(walletAddress),
  });
  const copyToClipboard = useCopyToClipboard();

  const {
    noOwners,
    deviceWalletPublicKeyIsMember,
    cloudWalletPublicKeyIsMember,
  } = useValidateWallet(walletAddress, WalletType.MULTIWALLET);

  useEffect(() => {
    const originalMembers =
      walletInfo?.members.map((x) => ({
        key: x.pubkey,
        type: getSignerTypeFromAddress(
          x,
          deviceWalletPublicKey,
          cloudWalletPublicKey
        ),
        state: SignerState.Unsigned,
      })) || [];
    setFilteredMembers(originalMembers);
  }, [walletInfo?.members, deviceWalletPublicKey, cloudWalletPublicKey]);

  const handleConfirm = useCallback(async () => {
    if (deviceWalletPublicKeyIsMember || cloudWalletPublicKeyIsMember) {
      setEdit(true);
      return;
    }
    if (!deviceWalletPublicKey || !cloudWalletPublicKey) {
      closeSheet();
      Alert.alert(
        "Wallet not found.",
        "You need to complete your wallet set up first."
      );
      router.replace("/(tabs)/profile");
      return;
    }
    if (noOwners && walletInfo) {
      setArgs({
        changeConfig: {
          newOwners: [
            {
              key: walletAddress,
              type: SignerType.NFC,
              state: SignerState.Unsigned,
            },
            {
              key: deviceWalletPublicKey,
              type: SignerType.DEVICE,
              state: SignerState.Unsigned,
            },
            {
              key: cloudWalletPublicKey,
              type: SignerType.CLOUD,
              state: SignerState.Unsigned,
            },
          ],
        },
        walletInfo,
      });
      setPage(Page.Confirmation);
    } else {
      setOffer(true);
      return;
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
      <XStack justifyContent="space-between" alignItems="center" width={"99%"}>
        <Text>Members:</Text>
      </XStack>
      <YGroup alignSelf="center" size="$5">
        {filteredMembers.map((member, index) => {
          return (
            <YGroup.Item key={member.key.toString()}>
              <CustomListItem
                onPress={() => copyToClipboard(member.key.toString())}
                bordered
                title={member.key.toString()}
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
      <CustomButton
        onPress={handleConfirm}
        themeInverse={
          !(deviceWalletPublicKeyIsMember || cloudWalletPublicKeyIsMember)
        }
      >
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
  setFilteredMembers: React.Dispatch<React.SetStateAction<TransactionSigner[]>>;
  setAdd: React.Dispatch<React.SetStateAction<boolean>>;
  filteredMembers: TransactionSigner[];
  walletAddress: PublicKey;
  setEdit: React.Dispatch<React.SetStateAction<boolean>>;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  reset: () => void;
}> = ({
  setAdd,
  filteredMembers,
  walletAddress,
  setFilteredMembers,
  setEdit,
  setArgs,
  setPage,
  reset,
}) => {
  const { deviceWalletPublicKey, cloudWalletPublicKey } = useWallets();
  const { data: walletInfo } = useGetWalletInfo({
    address: getMultiSigFromAddress(walletAddress),
  });
  const originalMembers = useMemo(() => {
    return (
      walletInfo?.members.map((x) => ({
        key: x.pubkey,
        type: getSignerTypeFromAddress(
          x,
          deviceWalletPublicKey,
          cloudWalletPublicKey
        ),
        state: SignerState.Unsigned,
      })) || []
    );
  }, [walletInfo?.members, deviceWalletPublicKey, cloudWalletPublicKey]);
  const handleConfirm = useCallback(async () => {
    if (walletInfo) {
      setArgs({
        changeConfig: {
          newOwners: filteredMembers,
        },
        walletInfo,
      });
      reset();
      setPage(Page.Confirmation);
    }
  }, [walletInfo, filteredMembers, setPage, reset]);

  return (
    <>
      <XStack justifyContent="space-between" alignItems="center" width={"99%"}>
        <Text>Members:</Text>
        <CustomButton onPress={() => setAdd(true)} bordered size={"$3"}>
          <ButtonIcon>
            <UserPlus size={"$1"} />
          </ButtonIcon>
          <ButtonText>Add Member</ButtonText>
        </CustomButton>
      </XStack>
      <YGroup alignSelf="center" size="$5">
        {filteredMembers.map((member, index) => {
          return (
            <YGroup.Item key={member.key.toString()}>
              <CustomListItem
                bordered
                title={member.key.toString()}
                subTitle={`Member ${index + 1} (${member.type})`}
                onPress={() =>
                  setFilteredMembers((prev) =>
                    prev.filter(
                      (x) => x.key.toString() !== member.key.toString()
                    )
                  )
                }
                icon={<User size={"$1"} />}
                iconAfter={<Trash2 color={"red"} size={"$1"} />}
              />
            </YGroup.Item>
          );
        })}
      </YGroup>
      <CustomButton
        onPress={() => {
          handleConfirm();
        }}
        themeInverse
      >
        <ButtonText>{"Confirm"}</ButtonText>
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
