import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { program } from "utils/consts";

export function useGetWalletInfo({ address }: { address: PublicKey | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      "get-wallet-info",
      { address, connection: connection.rpcEndpoint },
    ],
    queryFn: async () => {
      if (!address) return null;
      try {
        const multisigInfo = await program.account.multiWallet.fetch(address);
        return multisigInfo;
      } catch (e) {
        return null;
      }
    },
    staleTime: 1000 * 60 * 15,
    enabled: !!address,
  });
}
