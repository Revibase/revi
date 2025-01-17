import {
  collection,
  getDocs,
  query,
  where,
} from "@react-native-firebase/firestore";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useWallets } from "components/hooks/useWallets";
import { SignerType } from "utils/enums/transaction";
import { db } from "utils/firebase";
import {
  getAssetBatch,
  getAssetByOwner,
  getLabelFromSignerType,
  getTotalValueFromWallet,
  getVaultFromAddress,
} from "utils/helper";

export function useGetMultisigByOwner({
  isEnabled = true,
}: {
  isEnabled?: boolean;
}) {
  const { deviceWalletPublicKey, cloudWalletPublicKey } = useWallets();
  return useQuery({
    queryKey: [
      "get-multisig-by-owner",
      {
        deviceWalletPublicKey,
        cloudWalletPublicKey,
      },
    ],
    queryFn: async () => {
      try {
        const keys = [
          {
            label: getLabelFromSignerType(SignerType.DEVICE),
            pubkey: deviceWalletPublicKey?.toString(),
          },
          {
            label: getLabelFromSignerType(SignerType.CLOUD),
            pubkey: cloudWalletPublicKey?.toString(),
          },
        ].filter((x) => !!x.label && !!x.pubkey);
        if (keys.length === 0) {
          return null;
        }

        const docs = await getDocs(
          query(
            collection(db, "MultiWallets"),
            where("members", "array-contains-any", keys)
          )
        );
        if (docs.empty) {
          return null;
        }
        const accounts = docs.docs.map(
          (x) =>
            x.data() as {
              createKey: string;
              metadata: string | null;
              members: { label: string | null; pubkey: string }[];
              threshold: number;
            }
        );
        const accountsWithMetadata = accounts
          .filter((x) => !!x.metadata)
          .map((x) => x.metadata as string);

        const accountsMetadata = await getAssetBatch(accountsWithMetadata);

        const walletsWithData = await Promise.all(
          accounts.map(async (x) => {
            const vaultAddress = getVaultFromAddress(
              new PublicKey(x.createKey)
            );
            const assets = await getAssetByOwner(vaultAddress);
            const totalValue = assets ? getTotalValueFromWallet(assets) : 0;
            return {
              ...x,
              data: accountsMetadata.find((data) => data.id === x.metadata),
              totalValue: totalValue,
              vaultAddress: vaultAddress.toString(),
            };
          })
        );
        return walletsWithData;
      } catch (e) {
        console.log(e);
        return null;
      }
    },
    enabled: (!!cloudWalletPublicKey || !!deviceWalletPublicKey) && isEnabled,
  });
}
