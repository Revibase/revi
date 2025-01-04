import { useQuery } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { useGlobalVariables } from "components/providers/globalProvider";
import {
  getAssetBatch,
  getAssetByOwner,
  getTotalValueFromWallet,
  getVaultFromAddress,
} from "utils/helper";
import { program } from "utils/program";

export function useGetMultisigByOwner() {
  const { passkeyWalletPublicKey } = useGlobalVariables();
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      "get-multisig-by-owner",
      { connection: connection.rpcEndpoint, passkeyWalletPublicKey },
    ],
    queryFn: async () => {
      if (!passkeyWalletPublicKey) return null;

      const accounts = (
        await program.account.multiWallet.all([
          {
            memcmp: {
              offset: 112,
              bytes: passkeyWalletPublicKey.toString(),
            },
          },
        ])
      ).map((x) => x.account);

      const accountsWithMetadata = accounts
        .filter((x) => !!x.metadata)
        .map((x) => x.metadata?.toString()!);

      const accountsMetadata = await getAssetBatch(accountsWithMetadata);

      const walletsWithData = await Promise.all(
        accounts.map(async (x) => {
          const vaultAddress = getVaultFromAddress(x.createKey);
          const assets = await getAssetByOwner(vaultAddress);
          const totalValue = assets ? getTotalValueFromWallet(assets) : 0;
          return {
            ...x,
            data: accountsMetadata.find(
              (data) => data.id === x.metadata?.toString()
            ),
            totalValue: totalValue.toFixed(3),
            vaultAddress: vaultAddress.toString(),
          };
        })
      );

      return walletsWithData;
    },
    staleTime: 5 * 1000 * 60,
    enabled: !!passkeyWalletPublicKey,
  });
}
