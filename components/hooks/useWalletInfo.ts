import { doc } from "@react-native-firebase/firestore";
import { db, useFirestoreDocument, WalletInfo, WalletType } from "utils";

export const useWalletInfo = ({
  type,
  walletAddress,
}: {
  type?: WalletType;
  walletAddress?: string | null;
}) => {
  const { data: documentData, isLoading } = useFirestoreDocument({
    queryKey: ["document", `MultiWallets/${walletAddress}`],
    ref: doc(db(), `MultiWallets/${walletAddress}`),
    useQueryOptions: {
      queryKey: ["document", `MultiWallets/${walletAddress}`],
      enabled: !!walletAddress && type === WalletType.MULTIWALLET,
    },
  });

  return {
    walletInfo: documentData?.data() as WalletInfo | null | undefined,
    isLoading,
  };
};
