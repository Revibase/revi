import { PublicKey } from "@solana/web3.js";
import { FC, useEffect, useState } from "react";
import { Spinner, YStack } from "tamagui";
import { Page } from "utils/enums/wallet";
import { getMultiSigFromAddress } from "utils/helper";
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
}> = ({ walletAddress, mint, close }) => {
  const [page, setPage] = useState<Page>(Page.Loading);
  const [withdrawAsset, setWithdrawAsset] = useState<DAS.GetAssetResponse>();
  const [viewAsset, setViewAsset] = useState<DAS.GetAssetResponse>();
  const [transactionArgs, setTransactionArgs] =
    useState<TransactionArgs | null>(null);
  const { data: walletInfo, isLoading } = useGetWalletInfo({
    address: getMultiSigFromAddress(walletAddress),
  });
  useEffect(() => {
    if (page === Page.Loading) {
      if (isLoading) return;
      if (!walletInfo) {
        setPage(Page.Create);
      } else {
        setPage(Page.Main);
      }
    }
  }, [walletInfo, isLoading, page]);

  return (
    <YStack>
      {page == Page.Main && (
        <Main
          mint={mint}
          walletAddress={walletAddress}
          setPage={setPage}
          setViewAsset={setViewAsset}
          close={close}
          setArgs={setTransactionArgs}
        />
      )}
      {page == Page.Deposit && (
        <Deposit walletAddress={walletAddress} setPage={setPage} />
      )}
      {page == Page.Withdrawal && withdrawAsset && (
        <Withdrawal
          asset={withdrawAsset}
          setArgs={setTransactionArgs}
          setPage={setPage}
          setWithdrawAsset={setWithdrawAsset}
          walletInfo={walletInfo}
        />
      )}
      {page == Page.Asset && (
        <AssetPage
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
