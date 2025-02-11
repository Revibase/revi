import { useCallback, useMemo } from "react";
import { WalletInfo } from "utils";

export const useWalletMembership = ({
  walletInfo,
  walletAddress,
}: {
  walletInfo: WalletInfo | null | undefined;
  walletAddress?: string | null;
}) => {
  const noOwners = useMemo(
    () =>
      !!walletAddress &&
      !!walletInfo &&
      (walletInfo.members.filter((x) => x.pubkey !== walletAddress) || [])
        .length === 0,
    [walletInfo, walletAddress]
  );

  const isMember = useCallback(
    (publicKey?: string | null) => {
      if (!publicKey || noOwners || !walletAddress) return false;
      return (
        walletInfo?.members?.some((x) => x.pubkey === publicKey) ||
        walletAddress === publicKey
      );
    },
    [walletInfo, walletAddress, noOwners]
  );

  return { noOwners, isMember };
};
