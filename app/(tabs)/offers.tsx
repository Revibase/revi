import {
  collectionGroup,
  or,
  orderBy,
  query,
  where,
} from "@react-native-firebase/firestore";
import { DAS } from "@revibase/token-transfer";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Check, X } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { CustomCard } from "components/CustomCard";
import { CustomListItem } from "components/CustomListItem";
import {
  useGetMultiWallets,
  useOfferConfirmation,
  useWalletInfo,
} from "components/hooks";
import { FC, memo, useState } from "react";
import { Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ButtonText,
  Heading,
  ScrollView,
  Separator,
  SizableText,
  Tabs,
  Text,
  XStack,
  YGroup,
  YStack,
} from "tamagui";
import {
  db,
  EscrowActions,
  formatFirebaseTimestampToRelativeTime,
  Offer,
  Page,
  PLACEHOLDER_IMAGE,
  useGlobalStore,
  WalletType,
} from "utils";
import { useFirestoreCollection } from "utils/queries/useFirestoreCollection";

const offers: FC = () => {
  const { top } = useSafeAreaInsets();
  const [tab, setTab] = useState<string>("Current");

  return (
    <YStack pt={top} items="center" flex={1} gap="$4" px="$3" pb={"$4"}>
      <Heading p={"$4"} size={"$5"}>
        View Offers
      </Heading>
      <Tabs
        borderTopLeftRadius={"$4"}
        borderTopRightRadius={"$4"}
        borderBottomLeftRadius={"$4"}
        borderBottomRightRadius={"$4"}
        width="100%"
        flex={1}
        value={tab}
        onValueChange={setTab}
        orientation="horizontal"
        flexDirection="column"
        borderWidth="$0.25"
        overflow="hidden"
        borderColor="$borderColor"
      >
        <Tabs.List disablePassBorderRadius="bottom">
          <Tabs.Tab
            flex={1}
            value="Current"
            backgroundColor={tab === "Current" ? "$background" : "transparent"}
            borderBottomWidth={tab === "Current" ? "$0" : "$0.25"}
            borderBottomColor={"$borderColor"}
          >
            <SizableText fontFamily="$body">Current</SizableText>
          </Tabs.Tab>
          <Separator vertical />
          <Tabs.Tab
            flex={1}
            value="Yours"
            backgroundColor={tab === "Yours" ? "$background" : "transparent"}
            borderBottomWidth={tab === "Yours" ? "$0" : "$0.25"}
            borderBottomColor={"$borderColor"}
          >
            <SizableText fontFamily="$body">Yours</SizableText>
          </Tabs.Tab>
          <Separator vertical />
          <Tabs.Tab
            flex={1}
            value="History"
            backgroundColor={tab === "History" ? "$background" : "transparent"}
            borderBottomWidth={tab === "History" ? "$0" : "$0.25"}
            borderBottomColor={"$borderColor"}
          >
            <SizableText fontFamily="$body">History</SizableText>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Content value="Current" flex={1}>
          <OffersList
            label="You don't have any existing offers."
            type="Current"
          />
        </Tabs.Content>
        <Tabs.Content value="Yours" flex={1}>
          <OffersList label="You haven't made any offers yet." type="Yours" />
        </Tabs.Content>
        <Tabs.Content value="History" flex={1}>
          <OffersList label="No offers found." type="History" />
        </Tabs.Content>
      </Tabs>
    </YStack>
  );
};

export default offers;

const OffersList: FC<{
  label: string;
  type: "Current" | "Yours" | "History";
}> = ({ label, type }) => {
  const { deviceWalletPublicKey, cloudWalletPublicKey } = useGlobalStore();
  const { multiWallets } = useGetMultiWallets(false);
  const keys = [deviceWalletPublicKey, cloudWalletPublicKey].filter((x) => !!x);
  const proposerConstraint =
    keys && keys.length > 0 ? [where("proposer", "in", keys)] : [];
  const approverConstraint =
    keys && keys.length > 0 ? [where("approver", "in", keys)] : [];
  const proposerOrApproverConstraint =
    proposerConstraint.length > 0 && approverConstraint.length > 0
      ? [or(...proposerConstraint, ...approverConstraint)]
      : [];
  const createKeyConstraint =
    multiWallets && multiWallets.length > 0
      ? [
          where(
            "createKey",
            "in",
            multiWallets.map((x) => x.createKey)
          ),
        ]
      : [];
  const { data: pendingData } = useFirestoreCollection({
    queryKey: [
      "collectionGroup",
      "Escrow",
      {
        isPending: true,
        createKey: multiWallets?.map((x) => x.createKey),
        updatedAt: "desc",
      },
    ],
    query: query(
      collectionGroup(db(), "Escrow"),
      where("isPending", "==", true),
      ...createKeyConstraint,
      orderBy("updatedAt", "desc")
    ),
    useQueryOptions: {
      queryKey: [
        "collectionGroup",
        "Escrow",
        {
          isPending: true,
          createKey: multiWallets?.map((x) => x.createKey),
          updatedAt: "desc",
        },
      ],
      enabled: !!multiWallets && multiWallets.length > 0,
    },
  });
  const pendingOffers = pendingData?.docs.map((x) => x.data() as Offer);

  const { data: yourData } = useFirestoreCollection({
    queryKey: [
      "collectionGroup",
      "Escrow",
      {
        isPending: true,
        isEscrowClose: false,
        proposer: keys,
        updatedAt: "desc",
      },
    ],
    query: query(
      collectionGroup(db(), "Escrow"),
      or(where("isPending", "==", true), where("isEscrowClosed", "==", false)),
      ...proposerConstraint,
      orderBy("updatedAt", "desc")
    ),
    useQueryOptions: {
      queryKey: [
        "collectionGroup",
        "Escrow",
        {
          isPending: true,
          isEscrowClose: false,
          proposer: keys,
          updatedAt: "desc",
        },
      ],
      enabled: !!keys && keys.length > 0,
    },
  });
  const yourOffers = yourData?.docs.map((x) => x.data() as Offer);

  const { data: historyData } = useFirestoreCollection({
    queryKey: [
      "collectionGroup",
      "Escrow",
      {
        isPending: false,
        approver: keys,
        proposer: keys,
        updatedAt: "desc",
      },
    ],
    query: query(
      collectionGroup(db(), "Escrow"),
      where("isPending", "==", false),
      ...proposerOrApproverConstraint,
      orderBy("updatedAt", "desc")
    ),
    useQueryOptions: {
      queryKey: [
        "collectionGroup",
        "Escrow",
        {
          isPending: false,
          approver: keys,
          proposer: keys,
          updatedAt: "desc",
        },
      ],
      enabled: !!keys && keys.length > 0,
    },
  });

  const offerHistory = historyData?.docs.map((x) => x.data() as Offer);

  const offers =
    type === "Current"
      ? pendingOffers
      : type === "Yours"
      ? yourOffers
      : offerHistory;
  return (offers?.length || 0) > 0 ? (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YGroup>
        {offers?.map((offer) => (
          <YGroup.Item key={offer.identifier}>
            <RowItem offer={offer} type={type} />
          </YGroup.Item>
        ))}
      </YGroup>
    </ScrollView>
  ) : (
    <CenteredMessage>{label}</CenteredMessage>
  );
};

const RowItem: FC<{
  offer: Offer;
  type: "Current" | "Yours" | "History";
}> = memo(({ offer, type }) => {
  const { setWalletSheetArgs } = useGlobalStore();

  const { handleTransaction } = useOfferConfirmation(offer);

  const walletAddress = offer.createKey;
  const { walletInfo } = useWalletInfo({
    type: WalletType.MULTIWALLET,
    walletAddress,
  });
  const parsedMetadata = walletInfo?.fullMetadata
    ? (JSON.parse(walletInfo.fullMetadata) as DAS.GetAssetResponse)
    : undefined;
  return (
    <CustomListItem
      gap={"$1"}
      onPress={() => {
        setWalletSheetArgs({
          type: WalletType.MULTIWALLET,
          walletAddress,
          mint: walletInfo?.metadata || null,
          theme: "accent",
          offer,
          page: Page.Offer,
        });
      }}
      p={"$3"}
      title={`${(offer?.amount || 0) / LAMPORTS_PER_SOL} SOL`}
      subTitle={
        <CustomButton
          maxW={"$8"}
          bordered
          theme={
            offer.approver
              ? "green"
              : offer.isRejected
              ? "red"
              : offer.isPending
              ? "blue"
              : "yellow"
          }
          size={"$2"}
        >
          <ButtonText>
            {offer.approver
              ? "Accepted"
              : offer.isRejected
              ? "Rejected"
              : offer.isPending
              ? "Pending"
              : "Cancelled"}
          </ButtonText>
        </CustomButton>
      }
      icon={
        <CustomCard
          height={"$5"}
          url={parsedMetadata?.content?.links?.image || PLACEHOLDER_IMAGE}
        />
      }
      iconAfter={
        <YStack gap="$2" items="center">
          {type === "Current" && (
            <XStack gap="$3">
              <CustomButton
                bordered
                size="$3"
                circular
                theme="red"
                onPress={() =>
                  handleTransaction(EscrowActions.CancelEscrowAsOwner)
                }
              >
                <X />
              </CustomButton>
              <CustomButton
                bordered
                size="$3"
                circular
                theme="green"
                onPress={() =>
                  handleTransaction(EscrowActions.AcceptEscrowAsOwner)
                }
              >
                <Check />
              </CustomButton>
            </XStack>
          )}
          {type === "Yours" && (
            <CustomButton
              bordered
              size="$3"
              theme="red"
              onPress={() =>
                handleTransaction(EscrowActions.CancelEscrowAsNonOwner)
              }
            >
              <ButtonText>{"Cancel"}</ButtonText>
            </CustomButton>
          )}
          {type === "History" && (
            <CustomButton
              bordered
              size="$2"
              theme={"blue"}
              onPress={() =>
                Linking.openURL(`https://solscan.io/tx/${offer.txSig}`)
              }
            >
              {"View Transaction"}
            </CustomButton>
          )}
          <Text text="right" fontSize={type === "History" ? "$4" : "$2"}>
            {formatFirebaseTimestampToRelativeTime(offer.updatedAt)}
          </Text>
        </YStack>
      }
    />
  );
});

const CenteredMessage: FC<{ children: string }> = ({ children }) => (
  <YStack items="center" justify="center" flex={1}>
    <Text fontSize="$6" fontWeight={600}>
      {children}
    </Text>
  </YStack>
);
