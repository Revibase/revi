import {
  collectionGroup,
  getDocs,
  or,
  orderBy,
  query,
  where,
} from "@react-native-firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { useWallets } from "components/hooks/useWallets";
import { db } from "utils/firebase";
import { Offer } from "utils/types/offer";

export function useGetOffersHistory({ isEnabled }: { isEnabled: boolean }) {
  const { deviceWalletPublicKey, cloudWalletPublicKey } = useWallets();
  return useQuery({
    queryKey: [
      "get-offers-history",
      {
        deviceWalletPublicKey,
        cloudWalletPublicKey,
      },
    ],
    queryFn: async () => {
      try {
        const keys = [
          deviceWalletPublicKey?.toString(),
          cloudWalletPublicKey?.toString(),
        ].filter((x) => !!x);
        if (keys.length === 0) {
          return null;
        }
        const docs = await getDocs(
          query(
            collectionGroup(db, `Escrow`),
            where("isPending", "==", false),
            or(where("approver", "in", keys), where("proposer", "in", keys)),
            orderBy("updatedAt", "desc")
          )
        );

        return docs.docs.map((x) => x.data() as Offer);
      } catch (e) {
        console.log(e);
        return null;
      }
    },
    enabled: (!!cloudWalletPublicKey || !!deviceWalletPublicKey) && isEnabled,
  });
}
