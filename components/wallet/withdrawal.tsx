import { PublicKey } from "@solana/web3.js";
import { ArrowLeft, AtSign } from "@tamagui/lucide-icons";
import { FC, useState } from "react";
import {
  Button,
  ButtonIcon,
  ButtonText,
  Form,
  Heading,
  Image,
  Input,
  Text,
  VisuallyHidden,
  XStack,
  YStack,
} from "tamagui";
import { Page } from "utils/enums/wallet";
import { useCreateVaultExecuteIxMutation } from "utils/mutations/createVaultExecuteIx";
import { DAS } from "utils/types/das";

export const Withdrawal: FC<{
  walletAddress: PublicKey;
  asset: DAS.GetAssetResponse | undefined;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  setWithdrawAsset: React.Dispatch<
    React.SetStateAction<DAS.GetAssetResponse | undefined>
  >;
}> = ({ walletAddress, asset, setPage, setWithdrawAsset }) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const createVaultExecuteIxMutation = useCreateVaultExecuteIxMutation({
    wallet: walletAddress,
  });
  return (
    <YStack gap={"$4"} alignItems="center">
      <XStack
        gap={"$4"}
        padding="$2"
        paddingHorizontal="$4"
        justifyContent="space-between"
        width={"100%"}
        alignItems="center"
      >
        <Button
          onPress={() => {
            setPage(Page.Main);
            setWithdrawAsset(undefined);
          }}
        >
          <ArrowLeft />
        </Button>
        <Heading>{`Withdraw ${asset?.content?.metadata.name}`}</Heading>
        <VisuallyHidden>
          <ArrowLeft />
        </VisuallyHidden>
      </XStack>
      <Image source={{ uri: asset?.content?.links?.image }} alt="image" />
      <YStack>
        <Form>
          <XStack borderWidth={1}>
            <Input
              value={recipient}
              onChangeText={setRecipient}
              borderWidth={0}
              className="min-w-60"
              placeholder="Recipient's Solana PublicKey"
            />
            <Button className="rounded-full" theme={"active"}>
              <ButtonIcon children={<AtSign />}></ButtonIcon>
            </Button>
          </XStack>
          {(asset?.interface === "FungibleToken" ||
            asset?.interface === "FungibleAsset") && (
            <YStack>
              <XStack borderWidth={1}>
                <Input
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Amount"
                  inputMode="numeric"
                  className="min-w-60"
                  borderWidth={0}
                />
                <Button
                  onPress={() =>
                    setAmount(asset.token_info?.balance?.toString() || "")
                  }
                  className="rounded-full"
                >
                  <ButtonText>Max</ButtonText>
                </Button>
              </XStack>
              <XStack justifyContent="flex-end">
                <Text className="w-full text-right">
                  {`Available: ${
                    (asset.token_info?.balance || 0) /
                    10 ** (asset.token_info?.decimals || 0)
                  } ${asset.content?.metadata?.symbol}`}
                </Text>
              </XStack>
            </YStack>
          )}
          <Form.Trigger>
            <Button
              className="w-full"
              size="xl"
              onPress={async () => {
                if (!asset) return;
              }}
            >
              <ButtonText className="text-typography-0">Confirm</ButtonText>
            </Button>
          </Form.Trigger>
        </Form>
      </YStack>
    </YStack>
  );
};
