import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { getAssetByOwner } from "../helper";

export function useGetAssetsByOwner({
  address,
}: {
  address: PublicKey | null;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      "get-assets-by-owner",
      { address, connection: connection.rpcEndpoint },
    ],
    queryFn: async () => {
      if (!address) return null;
      const data = await getAssetByOwner(address, connection);
      if (data) {
        return data;
      }
      return null;
    },
    staleTime: 1000 * 60, //refresh every 1 min
    enabled: !!address,
  });
}
