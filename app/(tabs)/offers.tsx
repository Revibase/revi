import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Check, X } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { CustomListItem } from "components/CustomListItem";
import { useWallets } from "components/hooks/useWallets";
import { WalletSheets } from "components/wallet/sheets";
import { router } from "expo-router";
import { FC, memo, useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  ButtonText,
  Card,
  Heading,
  Image,
  ScrollView,
  Separator,
  SizableText,
  Tabs,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { PLACEHOLDER_IMAGE } from "utils/consts";
import { WalletType } from "utils/enums/wallet";
import {
  formatFirebaseTimestampToRelativeTime,
  getEscrow,
  getSignerTypeFromAddress,
} from "utils/helper";
import { useAcceptOrCancelEscrow } from "utils/mutations/acceptOrCancelEscrow";
import { program } from "utils/program";
import { useGetCurrentOffers } from "utils/queries/useGetCurrentOffers";
import { useGetMultisigByOwner } from "utils/queries/useGetMultisigByOwner";
import { useGetOffersHistory } from "utils/queries/useGetOffersHistory";
import { useGetYourOffers } from "utils/queries/useGetYourOffers";
import { Offer } from "utils/types/offer";
import { SignerState, TransactionArgs } from "utils/types/transaction";

const offers: FC = () => {
  const [transactionDetails, setTransactionDetails] = useState<{
    address?: PublicKey;
    mint?: PublicKey;
    args?: TransactionArgs;
  }>({});

  const resetTransaction = () => setTransactionDetails({});
  const { top } = useSafeAreaInsets();
  return (
    <YStack
      paddingTop={top}
      alignItems="center"
      flex={1}
      gap="$4"
      paddingHorizontal="$4"
      paddingBottom={"$4"}
    >
      <Heading padding={"$4"}>View Trade Offers</Heading>
      <Tabs
        width="100%"
        flex={1}
        defaultValue="tab1"
        orientation="horizontal"
        flexDirection="column"
        borderRadius="$4"
        borderWidth="$0.25"
        overflow="hidden"
        borderColor="$borderColor"
      >
        <Tabs.List disablePassBorderRadius="bottom">
          <Tabs.Tab flex={1} value="tab1">
            <SizableText fontFamily="$body">Current</SizableText>
          </Tabs.Tab>
          <Tabs.Tab flex={1} value="tab2">
            <SizableText fontFamily="$body">Yours</SizableText>
          </Tabs.Tab>
          <Tabs.Tab flex={1} value="tab3">
            <SizableText fontFamily="$body">History</SizableText>
          </Tabs.Tab>
        </Tabs.List>
        <Separator />
        <Tabs.Content value="tab1" flex={1}>
          <OffersList
            label="You don't have any existing offers."
            type="Current"
            setTransactionDetails={setTransactionDetails}
          />
        </Tabs.Content>
        <Tabs.Content value="tab2" flex={1}>
          <OffersList
            label="You haven't made any offers yet."
            type="Yours"
            setTransactionDetails={setTransactionDetails}
          />
        </Tabs.Content>
        <Tabs.Content value="tab3" flex={1}>
          <OffersList
            label="No offers found."
            type="History"
            setTransactionDetails={setTransactionDetails}
          />
        </Tabs.Content>
      </Tabs>
      <WalletSheets
        type={WalletType.MULTIWALLET}
        address={transactionDetails.address}
        reset={resetTransaction}
        mint={transactionDetails.mint}
        onEntry={transactionDetails.args}
      />
    </YStack>
  );
};

export default offers;

const OffersList: FC<{
  label: string;
  type: "Current" | "Yours" | "History";
  setTransactionDetails: (details: {
    address?: PublicKey;
    mint?: PublicKey;
    args?: TransactionArgs;
  }) => void;
}> = ({ label, type, setTransactionDetails }) => {
  const { data: multiWallets } = useGetMultisigByOwner({
    isEnabled: type === "Current",
  });
  const { data: currentOffers } = useGetCurrentOffers({
    accounts: multiWallets?.map((x) => x.createKey),
  });
  const { data: yourOffers } = useGetYourOffers({
    isEnabled: type === "Yours",
  });
  const { data: offerHistory } = useGetOffersHistory({
    isEnabled: type === "History",
  });

  const offers =
    type === "Current"
      ? currentOffers
      : type === "Yours"
      ? yourOffers
      : offerHistory;
  return (offers?.length || 0) > 0 ? (
    <ScrollView>
      {offers?.map((offer) => (
        <RowItem
          key={offer.identifier}
          offer={offer}
          type={type}
          setTransactionDetails={setTransactionDetails}
        />
      ))}
    </ScrollView>
  ) : (
    <CenteredMessage>{label}</CenteredMessage>
  );
};

const RowItem: FC<{
  offer: Offer;
  type: "Current" | "Yours" | "History";
  setTransactionDetails: (details: {
    address?: PublicKey;
    mint?: PublicKey;
    args?: TransactionArgs;
  }) => void;
}> = memo(({ offer, type, setTransactionDetails }) => {
  const { deviceWalletPublicKey, cloudWalletPublicKey } = useWallets();
  const { data: multiWallets } = useGetMultisigByOwner({});
  const metadata = useMemo(
    () => multiWallets?.find((wallet) => wallet.createKey === offer.createKey),
    [multiWallets, offer.createKey]
  );
  const walletAddress = new PublicKey(offer.createKey);
  const setEscrowMutation = useAcceptOrCancelEscrow({ walletAddress });

  const handleTransaction = useCallback(
    async (action: "CancelAsOwner" | "CancelAsProposer" | "AcceptAsOwner") => {
      const escrowData = await program.account.escrow.fetch(
        getEscrow(walletAddress, offer.identifier)
      );

      if (!escrowData.proposer) {
        Alert.alert("Error", "Unable to fetch escrow data.");
        return;
      }

      let args: TransactionArgs | null = null;
      if (action === "CancelAsProposer") {
        const ixs = await setEscrowMutation.mutateAsync({
          identifier: offer.identifier,
          type: action,
          proposer: escrowData.proposer,
        });
        if (ixs) {
          args = {
            signers: [
              {
                key: escrowData.proposer,
                state: SignerState.Unsigned,
                type: getSignerTypeFromAddress(
                  { pubkey: escrowData.proposer },
                  deviceWalletPublicKey,
                  cloudWalletPublicKey
                ),
              },
            ],
            ixs,
          };
        }
      } else if (metadata) {
        args = {
          walletInfo: {
            threshold: metadata.threshold,
            members: metadata.members.map((x) => ({
              label: x.label !== null ? parseInt(x.label) : null,
              pubkey: new PublicKey(x.pubkey),
            })),
          },
          escrowConfig: {
            identifier: offer.identifier,
            type: action,
            proposer: escrowData.proposer,
          },
        };
      }
      if (!args) {
        Alert.alert("Error", "Unable to parse instruction data.");
        return;
      }

      setTransactionDetails({
        address: walletAddress,
        mint: metadata?.metadata ? new PublicKey(metadata.metadata) : undefined,
        args,
      });
    },
    [
      walletAddress,
      deviceWalletPublicKey,
      cloudWalletPublicKey,
      offer,
      metadata,
      setEscrowMutation,
    ]
  );

  return (
    <CustomListItem
      bordered
      gap={"$1"}
      title={
        <Heading size={"$6"}>{`${
          offer.amount / LAMPORTS_PER_SOL
        } SOL`}</Heading>
      }
      subTitle={
        <XStack
          theme={
            offer.approver
              ? "green"
              : offer.isRejected
              ? "red"
              : offer.isPending
              ? "blue"
              : "orange"
          }
        >
          <Button size={"$2"}>
            <ButtonText>
              {offer.approver
                ? "Accepted"
                : offer.isRejected
                ? "Rejected"
                : offer.isPending
                ? "Pending"
                : "Cancelled"}
            </ButtonText>
          </Button>
        </XStack>
      }
      icon={
        <Card
          onPress={() => {
            setTransactionDetails({
              address: walletAddress,
              mint: metadata?.metadata
                ? new PublicKey(metadata.metadata)
                : undefined,
            });
          }}
          height={"$6"}
          aspectRatio="0.71"
        >
          <Card.Background>
            <Image
              height="100%"
              width="100%"
              borderWidth="$1"
              borderRadius="$2"
              objectFit="cover"
              source={{
                uri: metadata?.data?.content?.links?.image || PLACEHOLDER_IMAGE,
              }}
              alt="image"
            />
          </Card.Background>
        </Card>
      }
      iconAfter={
        <YStack gap="$2" alignItems="center">
          {type === "Current" && (
            <XStack gap="$3">
              <CustomButton
                size="$3"
                circular
                theme="red"
                onPress={() => handleTransaction("CancelAsOwner")}
              >
                <X />
              </CustomButton>
              <CustomButton
                size="$3"
                circular
                theme="green"
                onPress={() => handleTransaction("AcceptAsOwner")}
              >
                <Check />
              </CustomButton>
            </XStack>
          )}
          {type === "Yours" && (
            <CustomButton
              size="$3"
              theme="red"
              onPress={() => handleTransaction("CancelAsProposer")}
            >
              <ButtonText>{"Cancel"}</ButtonText>
            </CustomButton>
          )}
          {type === "History" && (
            <CustomButton
              size="$3"
              theme={"blue"}
              onPress={() =>
                router.navigate(`https://solscan.io/tx/${offer.txSig}`, {
                  relativeToDirectory: false,
                })
              }
            >
              {"View Transaction"}
            </CustomButton>
          )}
          <Text textAlign="right" fontSize={type === "History" ? "$4" : "$2"}>
            {formatFirebaseTimestampToRelativeTime(offer.updatedAt)}
          </Text>
        </YStack>
      }
    />
  );
});

const CenteredMessage: FC<{ children: string }> = ({ children }) => (
  <YStack alignItems="center" justifyContent="center" flex={1}>
    <Text fontSize="$6" fontWeight={600}>
      {children}
    </Text>
  </YStack>
);
