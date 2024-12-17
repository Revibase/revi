import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { getAssetByOwner } from "../helper";

export function useGetAssetsByOwner({
  address,
}: {
  address: PublicKey | null | undefined;
}) {
  return useQuery({
    queryKey: ["get-assets-by-owner", { address: address?.toString() || null }],
    queryFn: async () => {
      if (!address) return null;
      const data = await getAssetByOwner(address);
      if (data) {
        return data;
      }
      return null;
    },
    enabled: !!address,
  });
}
