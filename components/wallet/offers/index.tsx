import { collection, orderBy, query } from "@react-native-firebase/firestore";
import { DAS } from "@revibase/token-transfer";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { CustomButton } from "components/CustomButton";
import { CustomCard } from "components/CustomCard";
import { CustomListItem } from "components/CustomListItem";
import { useWalletInfo } from "components/hooks";
import { FC, memo } from "react";
import { ButtonText, Heading, Spinner, Text, YGroup, YStack } from "tamagui";
import {
  db,
  formatFirebaseTimestampToRelativeTime,
  Offer,
  Page,
  PLACEHOLDER_IMAGE,
  useGlobalStore,
  WalletType,
} from "utils";
import { useFirestoreCollection } from "utils/queries/useFirestoreCollection";
import { ScreenWrapper } from "../screenWrapper";

export const OffersPage: FC = () => {
  const { setPage, walletSheetArgs } = useGlobalStore();
  const { walletAddress, type } = walletSheetArgs ?? {};
  const { walletInfo } = useWalletInfo({ walletAddress, type });
  const parsedMetadata = walletInfo?.fullMetadata
    ? (JSON.parse(walletInfo.fullMetadata) as DAS.GetAssetResponse)
    : undefined;
  const { data, isLoading } = useFirestoreCollection({
    queryKey: [
      "collection",
      `MultiWallets/${walletAddress}/Escrow`,
      { updatedAt: "desc" },
    ],
    query: query(
      collection(db(), `MultiWallets/${walletAddress}/Escrow`),
      orderBy("updatedAt", "desc")
    ),
    useQueryOptions: {
      queryKey: [
        "collection",
        `MultiWallets/${walletAddress}/Escrow`,
        { updatedAt: "desc" },
      ],
      enabled: !!walletAddress && type === WalletType.MULTIWALLET,
    },
  });

  const currentOffers = data?.docs.map((x) => x.data() as Offer);

  return (
    <ScreenWrapper text={`View Offers`} reset={() => setPage(Page.Settings)}>
      <YStack gap={"$4"} flex={1}>
        {isLoading ? (
          <Spinner size="large" />
        ) : currentOffers && currentOffers.length > 0 ? (
          <>
            {currentOffers.filter((x) => x.isPending).length > 0 && (
              <>
                <Heading size={"$3"}>Highest Pending Offer:</Heading>
                <RowItem
                  offer={
                    currentOffers
                      .filter((x) => x.isPending)
                      .sort((a, b) => b.amount - a.amount)[0]
                  }
                  asset={parsedMetadata}
                />
              </>
            )}
            <Heading size={"$3"}>All Offers:</Heading>
            <YGroup bordered>
              {!isLoading &&
                currentOffers
                  .sort((a, b) => b.updatedAt.seconds - a.updatedAt.seconds)
                  .map((offer, index) => (
                    <YGroup.Item key={offer.identifier}>
                      <RowItem
                        top={index === 0}
                        bottom={index === currentOffers.length - 1}
                        offer={offer}
                        asset={parsedMetadata}
                      />
                    </YGroup.Item>
                  ))}
            </YGroup>
          </>
        ) : (
          <CenteredMessage children="No Offers found." />
        )}
      </YStack>
    </ScreenWrapper>
  );
};

const CenteredMessage: FC<{ children: string }> = ({ children }) => (
  <YStack items="center" justify="center" flex={1}>
    <Text fontSize="$6" fontWeight={600}>
      {children}
    </Text>
  </YStack>
);

const RowItem: FC<{
  top?: boolean;
  bottom?: boolean;
  offer: Offer | undefined;
  asset: DAS.GetAssetResponse | undefined;
}> = memo(({ offer, asset, top = false, bottom = false }) => {
  const { setPage, setOffer } = useGlobalStore();
  return (
    <CustomListItem
      p={"$3"}
      borderTopLeftRadius={top ? "$4" : "$0"}
      borderTopRightRadius={top ? "$4" : "$0"}
      borderBottomLeftRadius={bottom ? "$4" : "$0"}
      borderBottomRightRadius={bottom ? "$4" : "$0"}
      gap={"$1"}
      onPress={() => {
        setOffer(offer);
        setPage(Page.Offer);
      }}
      title={`${(offer?.amount || 0) / LAMPORTS_PER_SOL} SOL`}
      subTitle={`${offer?.proposer}`}
      icon={
        <CustomCard
          url={asset?.content?.links?.image || PLACEHOLDER_IMAGE}
          height={"$5"}
        />
      }
      iconAfter={
        <YStack gap="$2" items="flex-end" justify={"center"}>
          <CustomButton
            bordered
            theme={
              offer?.approver
                ? "green"
                : offer?.isRejected
                ? "red"
                : offer?.isPending
                ? "blue"
                : "yellow"
            }
            size={"$2"}
          >
            <ButtonText>
              {offer?.approver
                ? "Accepted"
                : offer?.isRejected
                ? "Rejected"
                : offer?.isPending
                ? "Pending"
                : "Cancelled"}
            </ButtonText>
          </CustomButton>
          <Text text="right" fontSize={"$2"}>
            {formatFirebaseTimestampToRelativeTime(offer?.updatedAt)}
          </Text>
        </YStack>
      }
    />
  );
});
