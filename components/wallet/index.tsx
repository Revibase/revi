import { PublicKey } from "@solana/web3.js";
import { FC, useEffect, useState } from "react";
import { Spinner, YStack } from "tamagui";
import { BLOCKCHAIN } from "utils/enums/chain";
import { Page } from "utils/enums/wallet";
import { getMultiSigFromAddress, getVaultFromAddress } from "utils/helper";
import { useGetAssetsByOwner } from "utils/queries/useGetAssetsByOwner";
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
  walletAddress: PublicKey | undefined;
  mint: PublicKey | undefined;
  blockchain: BLOCKCHAIN | undefined;
  close: () => void;
  deviceAddress?: PublicKey;
  cloudAddress?: PublicKey;
  isMultiSig?: boolean;
}> = ({
  walletAddress,
  mint,
  blockchain,
  isMultiSig = true,
  deviceAddress,
  cloudAddress,
  close,
}) => {
  const [page, setPage] = useState<Page>(Page.Loading);
  const [withdrawAsset, setWithdrawAsset] = useState<DAS.GetAssetResponse>();
  const [viewAsset, setViewAsset] = useState<DAS.GetAssetResponse>();
  const [transactionArgs, setTransactionArgs] =
    useState<TransactionArgs | null>(null);

  const { data: walletInfo, isLoading } = useGetWalletInfo({
    address:
      isMultiSig && !!walletAddress
        ? getMultiSigFromAddress(walletAddress)
        : null,
  });
  const { data: allAssets } = useGetAssetsByOwner({
    address:
      blockchain === BLOCKCHAIN.SOLANA && !!walletAddress
        ? walletInfo
          ? getVaultFromAddress({ address: walletAddress })
          : walletAddress
        : null,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!walletInfo && isMultiSig) {
      setPage(Page.Create);
    } else {
      setPage(Page.Main);
    }
  }, [walletInfo, isLoading, isMultiSig]);

  return (
    <YStack>
      {page == Page.Main && (
        <Main
          mint={mint}
          walletAddress={walletAddress}
          allAssets={allAssets}
          setPage={setPage}
          setViewAsset={setViewAsset}
          isMultiSig={isMultiSig}
          close={close}
          setArgs={setTransactionArgs}
        />
      )}
      {page == Page.Deposit && walletAddress && (
        <Deposit
          walletAddress={walletAddress}
          setPage={setPage}
          isMultiSig={isMultiSig}
        />
      )}
      {page == Page.Withdrawal && walletAddress && withdrawAsset && (
        <Withdrawal
          walletAddress={walletAddress}
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
          setPage={setPage}
          setArgs={setTransactionArgs}
        />
      )}
      {page == Page.Search && (
        <SearchPage
          allAssets={allAssets}
          setPage={setPage}
          setViewAsset={setViewAsset}
        />
      )}
      {page == Page.Confirmation && walletAddress && transactionArgs && (
        <ConfirmationPage
          walletAddress={walletAddress}
          setPage={setPage}
          args={transactionArgs}
          setArgs={setTransactionArgs}
        />
      )}
      {page == Page.Loading && (
        <YStack
          backgroundColor={"$colorTransparent"}
          justifyContent="center"
          alignItems="center"
        >
          <Spinner
            backgroundColor={"$colorTransparent"}
            size="large"
            color="$gray10"
          />
        </YStack>
      )}
    </YStack>
  );
};
