import { Connection } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { getAssetByOwner } from "../helper";

export function useGetAssetsByOwner({
  address,
}: {
  address: string | null | undefined;
}) {
  const { connection } = useConnection();
  return useQuery(getAssetByOwnerQuery(connection, address));
}
export const getAssetByOwnerQuery = (
  connection: Connection,
  address: string | null | undefined
) => ({
  queryKey: [
    "get-assets-by-owner",
    { connection: connection.rpcEndpoint, address },
  ],
  queryFn: async () => {
    if (!address) return null;
    const data = await getAssetByOwner(address, connection);
    if (data) {
      return { ...data, address };
    }
    return null;
  },
  enabled: !!address,
  staleTime: 1000 * 60,
  gcTime: 1000 * 60,
});
