import { PublicKey } from "@solana/web3.js";
import { FC, useEffect, useState } from "react";
import { Spinner, YStack } from "tamagui";
import { SignerType } from "utils/enums/transaction";
import { Page } from "utils/enums/wallet";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import { useGetWalletInfo } from "utils/queries/useGetWalletInfo";
import { DAS } from "utils/types/das";
import { TransactionArgs } from "utils/types/transaction";
import { AssetPage } from "./asset";
import { ConfirmationPage } from "./confirmation";
import { CreateMultisigPage } from "./create";
import { Deposit } from "./deposit";
import { Main } from "./main";
import { SearchPage } from "./search";
import { Withdrawal } from "./withdrawal";

export const Wallet: FC<{
  walletAddress: PublicKey;
  mint: PublicKey | undefined;
  close: () => void;
  type: SignerType;
}> = ({ type, walletAddress, mint, close }) => {
  const [page, setPage] = useState<Page>(Page.Loading);
  const [withdrawAsset, setWithdrawAsset] = useState<{
    asset: DAS.GetAssetResponse;
    callback?: () => void;
  }>();
  const [viewAsset, setViewAsset] = useState<DAS.GetAssetResponse>();
  const [transactionArgs, setTransactionArgs] =
    useState<TransactionArgs | null>(null);
  const { data: walletInfo, isLoading } = useGetWalletInfo({
    address:
      type === SignerType.NFC ? getMultiSigFromAddress(walletAddress) : null,
  });
  useEffect(() => {
    if (page === Page.Loading) {
      if (isLoading) return;
      if (!walletInfo && type === SignerType.NFC) {
        setPage(Page.Create);
      } else {
        setPage(Page.Main);
      }
    }
  }, [walletInfo, type, isLoading, page]);

  return (
    <YStack minHeight={"100%"}>
      {page == Page.Main && (
        <Main
          type={type}
          mint={mint}
          walletAddress={walletAddress}
          setPage={setPage}
          setViewAsset={setViewAsset}
          close={close}
          setArgs={setTransactionArgs}
          setWithdrawAsset={setWithdrawAsset}
        />
      )}
      {page == Page.Deposit && (
        <Deposit
          walletAddress={
            type === SignerType.NFC
              ? getVaultFromAddress(walletAddress)
              : walletAddress
          }
          setPage={setPage}
        />
      )}
      {page == Page.Withdrawal && withdrawAsset && (
        <Withdrawal
          type={type}
          withdrawal={withdrawAsset}
          setArgs={setTransactionArgs}
          setPage={setPage}
          setWithdrawAsset={setWithdrawAsset}
          walletAddress={walletAddress}
        />
      )}
      {page == Page.Asset && viewAsset && (
        <AssetPage
          type={type}
          walletAddress={walletAddress}
          asset={viewAsset}
          setPage={setPage}
          setWithdrawAsset={setWithdrawAsset}
        />
      )}
      {page == Page.Create && (
        <CreateMultisigPage
          walletAddress={walletAddress}
          mint={mint}
          setPage={setPage}
          setArgs={setTransactionArgs}
        />
      )}
      {page == Page.Search && (
        <SearchPage
          type={type}
          walletAddress={walletAddress}
          setPage={setPage}
          setViewAsset={setViewAsset}
        />
      )}
      {page == Page.Confirmation && transactionArgs && (
        <ConfirmationPage
          walletAddress={walletAddress}
          setPage={setPage}
          args={transactionArgs}
          setArgs={setTransactionArgs}
        />
      )}
      {page == Page.Loading && (
        <YStack
          flex={1}
          backgroundColor={"transparent"}
          justifyContent="center"
          alignItems="center"
        >
          <Spinner backgroundColor={"transparent"} size="large" />
        </YStack>
      )}
    </YStack>
  );
};
