import {
  collection,
  orderBy,
  query,
  where,
} from "@react-native-firebase/firestore";
import { db, Offer, WalletType } from "utils";
import { useFirestoreCollection } from "utils/queries/useFirestoreCollection";

export const usePendingOffers = ({
  type,
  walletAddress,
}: {
  type?: WalletType;
  walletAddress?: string | null;
}) => {
  if (type !== WalletType.MULTIWALLET || !walletAddress)
    return { pendingOffers: [], hasPendingOffers: false };
  const { data: collectionData } = useFirestoreCollection({
    queryKey: [
      "collection",
      `MultiWallets/${walletAddress}/Escrow`,
      { isPending: true, updatedAt: "desc" },
    ],
    query: query(
      collection(db(), `MultiWallets/${walletAddress}/Escrow`),
      where("isPending", "==", true),
      orderBy("updatedAt", "desc")
    ),
    useQueryOptions: {
      queryKey: [
        "collection",
        `MultiWallets/${walletAddress}/Escrow`,
        { isPending: true, updatedAt: "desc" },
      ],
      enabled: !!walletAddress,
    },
  });

  const pendingOffers = collectionData?.docs.map((x) => x.data() as Offer);

  return { pendingOffers, hasPendingOffers: (pendingOffers?.length || 0) > 0 };
};
