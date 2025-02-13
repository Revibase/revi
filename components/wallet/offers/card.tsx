import { getVaultFromAddress } from "@revibase/multi-wallet";
import { DAS } from "@revibase/token-transfer";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Check, X } from "@tamagui/lucide-icons";
import { CustomButton } from "components/CustomButton";
import { CustomCard } from "components/CustomCard";
import { CustomListItem } from "components/CustomListItem";
import {
  useOfferConfirmation,
  usePendingOffers,
  useWallet,
  useWalletInfo,
} from "components/hooks";
import { FC, useMemo } from "react";
import { Linking } from "react-native";
import {
  ButtonIcon,
  ButtonText,
  Heading,
  Text,
  XStack,
  YGroup,
  YStack,
} from "tamagui";
import {
  EscrowActions,
  formatAmount,
  getTotalValueFromWallet,
  Page,
  PLACEHOLDER_IMAGE,
  useGetAssetsByOwner,
  useGlobalStore,
  WalletType,
} from "utils";
import { ScreenWrapper } from "../screenWrapper";

export const OfferCard: FC = () => {
  const {
    setPage,
    walletSheetArgs,
    setOffer,
    defaultWallet,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
  } = useGlobalStore();
  const { offer, walletAddress, type } = walletSheetArgs ?? {};
  const { walletInfo } = useWalletInfo({ walletAddress, type });
  const parsedMetadata = walletInfo?.fullMetadata
    ? (JSON.parse(walletInfo.fullMetadata) as DAS.GetAssetResponse)
    : undefined;
  const { data: assets } = useGetAssetsByOwner({
    address: offer
      ? getVaultFromAddress(new PublicKey(offer.createKey)).toString()
      : null,
  });

  const { deviceWalletPublicKeyIsMember, cloudWalletPublicKeyIsMember } =
    useWallet({
      theme: "accent",
      type: WalletType.MULTIWALLET,
      walletAddress: offer?.createKey,
    });
  const { hasPendingOffers } = usePendingOffers({
    type: WalletType.MULTIWALLET,
    walletAddress: offer?.createKey,
  });
  const { handleTransaction } = useOfferConfirmation(offer);
  const userIsOwner = useMemo(
    () => deviceWalletPublicKeyIsMember || cloudWalletPublicKeyIsMember,
    [deviceWalletPublicKeyIsMember, cloudWalletPublicKeyIsMember]
  );
  const userIsProposer = useMemo(
    () =>
      !!offer &&
      (offer.proposer === deviceWalletPublicKey ||
        offer.proposer === cloudWalletPublicKey),
    [deviceWalletPublicKey, cloudWalletPublicKey, offer]
  );
  if (!offer) {
    return null;
  }
  return (
    <ScreenWrapper
      animation={{ opacity: 0 }}
      text={
        !offer.isPending
          ? "View Offer"
          : userIsOwner
          ? "Accept Or Reject Offer"
          : userIsProposer
          ? "Your Offer"
          : ""
      }
      reset={() => {
        setOffer(null);
        setPage(Page.OffersPage);
      }}
    >
      <YStack gap="$6">
        <YStack width={"100%"} gap="$4" items="center">
          <CustomCard
            height={"$20"}
            shadowColor={"white"}
            url={parsedMetadata?.content?.links?.image || PLACEHOLDER_IMAGE}
          />
          <YGroup bordered>
            {parsedMetadata?.content?.metadata.name && (
              <YGroup.Item>
                <CustomListItem
                  bordered
                  title={parsedMetadata?.content?.metadata.name}
                  subTitle={"Main Asset"}
                />
              </YGroup.Item>
            )}
            <YGroup.Item>
              <CustomListItem
                bordered
                title={getVaultFromAddress(
                  new PublicKey(offer.createKey)
                ).toString()}
                subTitle={"Wallet Address"}
              />
            </YGroup.Item>
            <YGroup.Item>
              <CustomListItem
                bordered
                title={hasPendingOffers ? "Locked" : "Unlocked"}
                subTitle={"Wallet Status"}
              />
            </YGroup.Item>
            <YGroup.Item>
              <CustomListItem
                bordered
                title={`${formatAmount(
                  assets ? getTotalValueFromWallet(assets) : 0
                )} USD`}
                subTitle={"Estimated Wallet Value"}
              />
            </YGroup.Item>
          </YGroup>
        </YStack>
        <YStack gap={"$4"}>
          <Heading size={"$4"}>{`Offer Details`}</Heading>
          {offer.isRejected && (
            <Text>{`Offer has been rejected. ${
              offer.isEscrowClosed ? "" : "Reclaim it to recover your funds."
            }`}</Text>
          )}
          {offer.approver && (
            <Text>{`Offer is accepted by ${offer.approver}.`}</Text>
          )}
          {userIsOwner && offer.isPending ? (
            <YGroup bordered>
              <YGroup.Item>
                <CustomListItem
                  theme={"green"}
                  title={`You receive ${formatAmount(
                    offer.amount / LAMPORTS_PER_SOL
                  )} SOL.`}
                  subTitle={`${
                    defaultWallet === deviceWalletPublicKey
                      ? WalletType.DEVICE
                      : WalletType.CLOUD
                  }, ${defaultWallet?.substring(
                    0,
                    14
                  )}... to receive ${formatAmount(
                    offer.amount / LAMPORTS_PER_SOL
                  )} SOL.`}
                />
              </YGroup.Item>
              <YGroup.Item>
                <CustomListItem
                  theme={"red"}
                  title={`You lose ownership of the wallet.`}
                  subTitle={`Transfer Asset Ownership to ${offer.proposer}`}
                />
              </YGroup.Item>
            </YGroup>
          ) : userIsProposer && offer.isPending ? (
            <YGroup bordered>
              <YGroup.Item>
                <CustomListItem
                  theme={"green"}
                  title={`You gain ownership to the wallet.`}
                  subTitle={`Transfer Asset Ownership to ${offer.proposer.substring(
                    0,
                    14
                  )}...`}
                />
              </YGroup.Item>
              <YGroup.Item>
                <CustomListItem
                  theme={"red"}
                  title={`You spend ${formatAmount(
                    offer.amount / LAMPORTS_PER_SOL
                  )} SOL`}
                />
              </YGroup.Item>
            </YGroup>
          ) : (
            <YGroup bordered>
              <YGroup.Item>
                <CustomListItem
                  title={`Amount`}
                  iconAfter={
                    <Text>{`${formatAmount(
                      offer.amount / LAMPORTS_PER_SOL
                    )} SOL`}</Text>
                  }
                />
              </YGroup.Item>
              <YGroup.Item>
                <CustomListItem
                  title={`Proposer`}
                  iconAfter={
                    <Text numberOfLines={1}>{`${offer.proposer.substring(
                      0,
                      24
                    )}...`}</Text>
                  }
                />
              </YGroup.Item>
              <YGroup.Item>
                <CustomListItem
                  title={`Status`}
                  iconAfter={
                    <Text>
                      {offer.approver
                        ? "Accepted"
                        : offer.isRejected
                        ? "Rejected"
                        : offer.isPending
                        ? "Pending"
                        : "Cancelled"}
                    </Text>
                  }
                />
              </YGroup.Item>
            </YGroup>
          )}
        </YStack>
        <XStack gap="$3" items={"center"} justify={"center"}>
          {userIsOwner && offer.isPending && (
            <>
              <CustomButton
                bordered
                size="$5"
                onPress={() =>
                  handleTransaction(EscrowActions.CancelEscrowAsOwner)
                }
              >
                <ButtonText>{`Reject Offer`}</ButtonText>
                <ButtonIcon>
                  <X size={"$1"} />
                </ButtonIcon>
              </CustomButton>
              <CustomButton
                bordered
                size="$5"
                onPress={() =>
                  handleTransaction(EscrowActions.AcceptEscrowAsOwner)
                }
              >
                <ButtonText>{`Accept Offer`}</ButtonText>
                <ButtonIcon>
                  <Check size={"$1"} />
                </ButtonIcon>
              </CustomButton>
            </>
          )}
          {userIsProposer &&
            !offer.isEscrowClosed &&
            (offer.isPending || offer.isRejected) && (
              <CustomButton
                bordered
                size="$5"
                onPress={() =>
                  handleTransaction(EscrowActions.CancelEscrowAsNonOwner)
                }
              >
                <ButtonText>
                  {offer.isPending ? `Withdraw Offer` : `Reclaim Offer`}
                </ButtonText>
              </CustomButton>
            )}
          {offer.approver && (
            <CustomButton
              bordered
              onPress={() =>
                Linking.openURL(`https://solscan.io/tx/${offer.txSig}`)
              }
            >
              {"View Transaction"}
            </CustomButton>
          )}
        </XStack>
      </YStack>
    </ScreenWrapper>
  );
};
