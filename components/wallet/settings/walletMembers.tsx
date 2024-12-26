import { PublicKey } from "@solana/web3.js";
import { Copy, Edit3, Trash2, User, UserPlus } from "@tamagui/lucide-icons";
import { useCopyToClipboard } from "components/hooks/useCopyToClipboard";
import { useGlobalVariables } from "components/providers/globalProvider";
import { router } from "expo-router";
import { FC, useCallback, useEffect, useState } from "react";
import {
  Button,
  ButtonIcon,
  ButtonText,
  Heading,
  Input,
  ListItem,
  Text,
  XStack,
  YGroup,
} from "tamagui";
import { SignerType } from "utils/enums/transaction";
import { Page } from "utils/enums/wallet";
import { getMultiSigFromAddress, getSignerTypeFromAddress } from "utils/helper";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import {
  SignerState,
  TransactionArgs,
  TransactionSigner,
} from "utils/types/transaction";

export const RenderWalletMembers: FC<{
  edit: boolean;
  walletAddress: PublicKey;
  setEdit: React.Dispatch<React.SetStateAction<boolean>>;
  setArgs: React.Dispatch<React.SetStateAction<TransactionArgs | null>>;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  reset: () => void;
  closeSheet: () => void;
}> = ({
  edit,
  walletAddress,
  setEdit,
  setArgs,
  setPage,
  reset,
  closeSheet,
}) => {
  const [filteredMembers, setFilteredMembers] = useState<TransactionSigner[]>(
    []
  );
  const [add, setAdd] = useState(false);
  if (add)
    return (
      <RenderAddMembers
        setFilteredMembers={setFilteredMembers}
        setAdd={setAdd}
      />
    );
  if (edit)
    return (
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
    );
  return (
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
  );
};
const RenderAddMembers: FC<{
  setFilteredMembers: React.Dispatch<React.SetStateAction<TransactionSigner[]>>;
  setAdd: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ setFilteredMembers, setAdd }) => {
  const { primaryAddress, secondaryAddress } = useGlobalVariables();
  const [value, setValue] = useState("");
  const reset = () => {
    setAdd(false);
    setValue("");
  };
  return (
    <>
      <Heading size={"$1"}>Use Recommended</Heading>
      <YGroup>
        <YGroup.Item>
          <ListItem
            onPress={() => {
              if (primaryAddress) {
                setFilteredMembers((prev) => [
                  ...prev.filter(
                    (x) => x.key.toString() !== primaryAddress.toString()
                  ),
                  {
                    key: primaryAddress,
                    type: SignerType.PRIMARY,
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
            title={primaryAddress?.toString()}
            subTitle={SignerType.PRIMARY}
          />
        </YGroup.Item>
        <YGroup.Item>
          <ListItem
            onPress={() => {
              if (secondaryAddress) {
                setFilteredMembers((prev) => [
                  ...prev.filter(
                    (x) => x.key.toString() !== secondaryAddress.toString()
                  ),
                  {
                    key: secondaryAddress,
                    type: SignerType.PRIMARY,
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
            title={secondaryAddress?.toString()}
            subTitle={SignerType.SECONDARY}
          />
        </YGroup.Item>
      </YGroup>
      <Text textAlign="center">OR</Text>
      <Input
        size="$3"
        value={value}
        onChangeText={setValue}
        placeholder="Enter a custom wallet address"
      />
      <Button
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
      </Button>
      <Button
        onPress={() => {
          reset();
        }}
      >
        <ButtonText>{"Back"}</ButtonText>
      </Button>
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
  const { primaryAddress, secondaryAddress } = useGlobalVariables();
  const { data: walletInfo } = useGetWalletInfo({
    address: getMultiSigFromAddress(walletAddress),
  });
  const copyToClipboard = useCopyToClipboard();

  const noOwners =
    !!walletInfo?.members &&
    (
      walletInfo?.members.filter(
        (x) => x.toString() !== walletAddress.toString()
      ) || []
    ).length === 0;
  const isMultisigMember =
    !!primaryAddress &&
    !!secondaryAddress &&
    (walletInfo?.members.findIndex(
      (x) => x.toString() === primaryAddress.toString()
    ) !== -1 ||
      walletInfo?.members.findIndex(
        (x) => x.toString() === secondaryAddress.toString()
      ) !== -1);

  const orginalMembers =
    walletInfo?.members.map((x) => ({
      key: x,
      type: getSignerTypeFromAddress(
        x,
        walletInfo.createKey,
        primaryAddress,
        secondaryAddress
      ),
      state: SignerState.Unsigned,
    })) || [];
  useEffect(() => {
    setFilteredMembers(orginalMembers);
  }, [walletInfo?.members]);

  const handleConfirm = useCallback(async () => {
    if (isMultisigMember) {
      setEdit(true);
    } else {
      if (!primaryAddress || !secondaryAddress) {
        reset();
        closeSheet();
        router.replace("/(tabs)/profile");
        return;
      }
      if (noOwners) {
        if (walletInfo) {
          setArgs({
            changeConfig: {
              newOwners: [
                {
                  key: primaryAddress,
                  type: SignerType.PRIMARY,
                  state: SignerState.Unsigned,
                },
                {
                  key: primaryAddress,
                  type: SignerType.SECONDARY,
                  state: SignerState.Unsigned,
                },
              ],
            },
            walletInfo,
          });
          reset();
          setPage(Page.Confirmation);
        }
      } else {
        //send notification to current owner
      }
    }
  }, [isMultisigMember, walletInfo, filteredMembers, setPage, reset, setEdit]);

  return (
    <>
      <XStack justifyContent="space-between" alignItems="center" width={"99%"}>
        <Text>Members:</Text>
      </XStack>
      <YGroup alignSelf="center" bordered size="$5">
        {filteredMembers.map((member, index) => {
          return (
            <YGroup.Item key={member.key.toString()}>
              <ListItem
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
      <Button onPress={handleConfirm} themeInverse={!isMultisigMember}>
        <ButtonText>
          {isMultisigMember ? "Edit Members" : "Request To Become Owner"}
        </ButtonText>
        {isMultisigMember && (
          <ButtonIcon>
            <Edit3 size={"$1"} />
          </ButtonIcon>
        )}
      </Button>
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
  const { primaryAddress, secondaryAddress } = useGlobalVariables();
  const { data: walletInfo } = useGetWalletInfo({
    address: getMultiSigFromAddress(walletAddress),
  });
  const orginalMembers =
    walletInfo?.members.map((x) => ({
      key: x,
      type: getSignerTypeFromAddress(
        x,
        walletInfo.createKey,
        primaryAddress,
        secondaryAddress
      ),
      state: SignerState.Unsigned,
    })) || [];
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
        <Button
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
        </Button>
      </XStack>
      <YGroup alignSelf="center" bordered size="$5">
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
                  <Button
                    pressTheme
                    hoverTheme
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
      <Button
        onPress={() => {
          handleConfirm();
        }}
        themeInverse
      >
        <ButtonText>{"Confirm"}</ButtonText>
      </Button>
      <Button
        onPress={() => {
          setEdit(false);

          setFilteredMembers(orginalMembers);
        }}
      >
        <ButtonText>{"Cancel"}</ButtonText>
      </Button>
    </>
  );
};
