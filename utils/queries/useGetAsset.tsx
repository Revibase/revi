import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { getAsset } from "../helper";

export function useGetAsset({ mint }: { mint: PublicKey | undefined }) {
  return useQuery({
    queryKey: ["get-asset", { mint: mint?.toString() || null }],
    queryFn: async () => {
      if (!mint) return null;
      return getAsset(mint);
    },
    staleTime: 1000 * 60 * 15,
    enabled: !!mint,
  });
}
