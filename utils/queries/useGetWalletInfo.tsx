import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { program } from "utils/program";

export function useGetWalletInfo({ address }: { address: PublicKey | null }) {
  return useQuery({
    queryKey: ["get-wallet-info", { address: address?.toString() || null }],
    queryFn: async () => {
      if (!address) return null;
      try {
        const multisigInfo = await program.account.multiWallet.fetch(
          address,
          "confirmed"
        );
        return multisigInfo;
      } catch (e) {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!address,
  });
}
