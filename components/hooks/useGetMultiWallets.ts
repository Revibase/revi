import { collection, query, where } from "@react-native-firebase/firestore";
import { getVaultFromAddress } from "@revibase/multi-wallet";
import { PublicKey } from "@solana/web3.js";
import { useQueries } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import {
  db,
  getAssetByOwnerQuery,
  getTotalValueFromWallet,
  useFirestoreCollection,
  useGlobalStore,
  WalletInfo,
} from "utils";

export const useGetMultiWallets = (withMetadata = true) => {
  const { deviceWalletPublicKey, paymasterWalletPublicKey } = useGlobalStore();
  const { connection } = useConnection();
  const keys = [deviceWalletPublicKey, paymasterWalletPublicKey].filter(
    (x) => !!x
  );
  const membersArrayConstraint =
    keys && keys.length > 0
      ? [where("membersArray", "array-contains-any", keys)]
      : [];
  const { data } = useFirestoreCollection({
    queryKey: [`collection`, `MultiWallets`, { membersArray: keys }],
    query: query(collection(db(), `MultiWallets`), ...membersArrayConstraint),
    useQueryOptions: {
      queryKey: [`collection`, `MultiWallets`, { membersArray: keys }],
      enabled: !!keys && keys.length > 0,
    },
  });
  const accounts = data?.docs
    .map((x) => x.data() as WalletInfo)
    .map((x) => ({
      ...x,
      vaultAddress: "",
      data: undefined,
      totalValue: 0,
    }));

  if (!withMetadata) {
    return { multiWallets: accounts };
  }

  const assets = useQueries({
    queries:
      accounts?.map((x) =>
        getAssetByOwnerQuery(
          connection,
          getVaultFromAddress(new PublicKey(x.createKey)).toString()
        )
      ) || [],
  });
  const multiWallets = accounts?.map((x) => {
    const vaultAddress = getVaultFromAddress(
      new PublicKey(x.createKey)
    ).toString();
    const data = assets
      .find((y) => y.data?.address === vaultAddress)
      ?.data?.items.find((y) => y.id === x.metadata);

    return {
      ...x,
      vaultAddress,
      data,
      totalValue: getTotalValueFromWallet(
        assets.find((y) => y.data?.address === vaultAddress)?.data
      ),
    };
  });
  return { multiWallets };
};
