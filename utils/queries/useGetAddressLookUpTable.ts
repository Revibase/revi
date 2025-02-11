import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";

export function useGetAddressLookUpTable({
  address,
}: {
  address: string | undefined | null;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ["get-address-look-up-table", { address }],
    queryFn: async () => {
      if (!address) return null;
      return (await connection.getAddressLookupTable(new PublicKey(address)))
        .value;
    },
    enabled: !!address,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
