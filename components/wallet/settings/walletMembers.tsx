import { PublicKey } from "@solana/web3.js";
import { Copy, Edit3, Trash2, User, UserPlus } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { CustomButton } from "components/CustomButton";
import { useCopyToClipboard } from "components/hooks/useCopyToClipboard";
import { useGlobalVariables } from "components/providers/globalProvider";
import { router } from "expo-router";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
  ButtonIcon,
  ButtonText,
  Heading,
  Input,
  ListItem,
  Text,
  XStack,
  YGroup,
} from "tamagui";
import { Page } from "utils/enums/page";
import { SignerType } from "utils/enums/transaction";
import { getMultiSigFromAddress, getSignerTypeFromAddress } from "utils/helper";
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

  const [edit, setEdit] = useState(false);
  const [add, setAdd] = useState(false);

  if (add) {
    return (
      <>
        <Header text={"Add Member"} reset={reset} />
        <RenderAddMembers
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
      <RenderWalletInfo type={SignerType.NFC} walletAddress={walletAddress} />
      <RenderMembers
        setFilteredMembers={setFilteredMembers}
        filteredMembers={filteredMembers}
        walletAddress={walletAddress}
        setEdit={setEdit}
        setArgs={setArgs}
        setPage={setPage}
        reset={reset}
        closeSheet={closeSheet}
      />
    </>
  );
};
const RenderAddMembers: FC<{
  filteredMembers: TransactionSigner[];
  setFilteredMembers: React.Dispatch<React.SetStateAction<TransactionSigner[]>>;
  setAdd: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ filteredMembers, setFilteredMembers, setAdd }) => {
  const { deviceWalletPublicKey, passkeyWalletPublicKey } =
    useGlobalVariables();
  const [value, setValue] = useState("");
  const reset = () => {
    setAdd(false);
    setValue("");
  };
  return (
    <>
      {(filteredMembers.findIndex(
        (x) => x.key.toString() === deviceWalletPublicKey?.toString()
      ) === -1 ||
        filteredMembers.findIndex(
          (x) => x.key.toString() === passkeyWalletPublicKey?.toString()
        ) === -1) && (
        <>
          <Heading size={"$1"}>Use Recommended</Heading>
          <YGroup>
            {filteredMembers.findIndex(
              (x) => x.key.toString() === deviceWalletPublicKey?.toString()
            ) === -1 && (
              <YGroup.Item>
                <ListItem
                  hoverStyle={{ scale: 0.925 }}
                  pressStyle={{ scale: 0.925 }}
                  animation="bouncy"
                  onPress={() => {
                    if (deviceWalletPublicKey) {
                      setFilteredMembers((prev) => [
                        ...prev.filter(
                          (x) =>
                            x.key.toString() !==
                            deviceWalletPublicKey.toString()
                        ),
                        {
                          key: deviceWalletPublicKey,
                          type: SignerType.DEVICE,
                          state: SignerState.Unsigned,
                        },
                      ]);
                      reset();
                    }
                  }}
                  pressTheme
                  hoverTheme
                  bordered
                  icon={<User size={"$1"} />}
                  title={deviceWalletPublicKey?.toString()}
                  subTitle={SignerType.DEVICE}
                />
              </YGroup.Item>
            )}
            {filteredMembers.findIndex(
              (x) => x.key.toString() === passkeyWalletPublicKey?.toString()
            ) === -1 && (
              <YGroup.Item>
                <ListItem
                  hoverStyle={{ scale: 0.925 }}
                  pressStyle={{ scale: 0.925 }}
                  animation="bouncy"
                  onPress={() => {
                    if (passkeyWalletPublicKey) {
                      setFilteredMembers((prev) => [
                        ...prev.filter(
                          (x) =>
                            x.key.toString() !==
                            passkeyWalletPublicKey.toString()
                        ),
                        {
                          key: passkeyWalletPublicKey,
                          type: SignerType.DEVICE,
                          state: SignerState.Unsigned,
                        },
                      ]);
                      reset();
                    }
                  }}
                  bordered
                  pressTheme
                  hoverTheme
                  icon={<User size={"$1"} />}
                  title={passkeyWalletPublicKey?.toString()}
                  subTitle={SignerType.PASSKEY}
                />
              </YGroup.Item>
            )}
          </YGroup>
          <Heading size={"$1"} textAlign="center">
            Or
          </Heading>
        </>
      )}
      <Input
        size="$3"
        value={value}
        onChangeText={setValue}
        placeholder="Enter a custom wallet address"
      />
      <CustomButton
        onPress={() => {
          try {
            new PublicKey(value);
          } catch (e) {
            return;
          }
          setFilteredMembers((prev) => [
            ...prev.filter((x) => x.key.toString() !== value),
            {
              key: new PublicKey(value),
              type: SignerType.UNKNOWN,
              state: SignerState.Unsigned,
            },
          ]);
          reset();
        }}
        themeInverse
      >
        <ButtonText>{"Add Member"}</ButtonText>
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

const RenderMembers: FC<{
  filteredMembers: TransactionSigner[];
  setFilteredMembers: React.Dispatch<React.SetStateAction<TransactionSigner[]>>;
  walletAddress: PublicKey;
  setEdit: React.Dispatch<React.SetStateAction<boolean>>;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  reset: () => void;
  closeSheet: () => void;
}> = ({
  filteredMembers,
  setFilteredMembers,
  walletAddress,
  setEdit,
  setArgs,
  setPage,
  reset,
  closeSheet,
}) => {
  const { deviceWalletPublicKey, passkeyWalletPublicKey } =
    useGlobalVariables();
  const { data: walletInfo } = useGetWalletInfo({
    address: getMultiSigFromAddress(walletAddress),
  });
  const copyToClipboard = useCopyToClipboard();
  const toast = useToastController();
  const noOwners = useMemo(() => {
    return (
      !!walletInfo?.members &&
      (
        walletInfo?.members.filter(
          (x) => x.pubkey.toString() !== walletAddress.toString()
        ) || []
      ).length === 0
    );
  }, [walletInfo?.members, walletAddress]);

  const isMultisigMember = useMemo(() => {
    return (
      !!walletInfo &&
      !!deviceWalletPublicKey &&
      !!passkeyWalletPublicKey &&
      (walletInfo.members.findIndex(
        (x) => x.pubkey.toString() === deviceWalletPublicKey.toString()
      ) !== -1 ||
        walletInfo.members.findIndex(
          (x) => x.pubkey.toString() === passkeyWalletPublicKey.toString()
        ) !== -1)
    );
  }, [deviceWalletPublicKey, passkeyWalletPublicKey, walletInfo?.members]);

  const originalMembers = useMemo(() => {
    return (
      walletInfo?.members.map((x) => ({
        key: x.pubkey,
        type: getSignerTypeFromAddress(
          x,
          deviceWalletPublicKey,
          passkeyWalletPublicKey
        ),
        state: SignerState.Unsigned,
      })) || []
    );
  }, [walletInfo?.members, deviceWalletPublicKey, passkeyWalletPublicKey]);
  useEffect(() => {
    setFilteredMembers(originalMembers);
  }, [walletInfo?.members]);

  const handleConfirm = useCallback(async () => {
    if (isMultisigMember) {
      setEdit(true);
      return;
    }
    if (!deviceWalletPublicKey || !passkeyWalletPublicKey) {
      reset();
      closeSheet();
      toast.show("Error", {
        message: "Device and Passkey Wallet needs to be created first.",
        customData: { preset: "error" },
      });
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
              key: passkeyWalletPublicKey,
              type: SignerType.PASSKEY,
              state: SignerState.Unsigned,
            },
          ],
        },
        walletInfo,
      });
      reset();
      setPage(Page.Confirmation);
    } else {
      //send notification to current owner
      toast.show("Success", {
        message: "Request to become owner has been sent to current owner.",
        customData: { preset: "success" },
      });
    }
  }, [
    walletAddress,
    noOwners,
    isMultisigMember,
    walletInfo,
    deviceWalletPublicKey,
    passkeyWalletPublicKey,
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
              <ListItem
                hoverStyle={{ scale: 0.925 }}
                pressStyle={{ scale: 0.925 }}
                animation="bouncy"
                onPress={() => copyToClipboard(member.key.toString())}
                hoverTheme
                pressTheme
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
      <CustomButton onPress={handleConfirm} themeInverse={!isMultisigMember}>
        <ButtonText>
          {isMultisigMember
            ? "Edit Members"
            : noOwners
            ? "Take Over as Owner"
            : "Request To Become Owner"}
        </ButtonText>
        {isMultisigMember && (
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
  const { deviceWalletPublicKey, passkeyWalletPublicKey } =
    useGlobalVariables();
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
          passkeyWalletPublicKey
        ),
        state: SignerState.Unsigned,
      })) || []
    );
  }, [walletInfo?.members, deviceWalletPublicKey, passkeyWalletPublicKey]);
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
        <CustomButton
          onPress={() => setAdd(true)}
          hoverTheme
          pressTheme
          bordered
          size={"$3"}
        >
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
              <ListItem
                hoverTheme
                pressTheme
                bordered
                title={member.key.toString()}
                subTitle={`Member ${index + 1} (${member.type})`}
                icon={<User size={"$1"} />}
                iconAfter={
                  <CustomButton
                    variant="outlined"
                    borderWidth="$0"
                    onPress={() =>
                      setFilteredMembers((prev) =>
                        prev.filter(
                          (x) => x.key.toString() !== member.key.toString()
                        )
                      )
                    }
                    icon={<Trash2 color={"red"} size={"$1"} />}
                  />
                }
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
