import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "@react-native-firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { db } from "utils/firebase";
import { Offer } from "utils/types/offer";

export function useGetCurrentOffers({
  accounts,
}: {
  accounts: string[] | null | undefined;
}) {
  return useQuery({
    queryKey: [
      "get-current-offers",
      {
        accounts,
      },
    ],
    queryFn: async () => {
      try {
        if (!accounts) return null;
        const docs = await Promise.all(
          accounts.map((x) =>
            getDocs(
              query(
                collection(db, `MultiWallets/${x}/Escrow`),
                where("isPending", "==", true),
                orderBy("updatedAt", "desc")
              )
            )
          )
        );

        return docs.flatMap((x) => x.docs.flatMap((x) => x.data() as Offer));
      } catch (e) {
        console.log(e);
        return null;
      }
    },
    enabled: !!accounts && accounts.length > 0,
  });
}
