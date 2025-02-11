import { useQuery } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { getAsset } from "../helper";

export function useGetAsset({ mint }: { mint: string | undefined | null }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ["get-asset", { connection: connection.rpcEndpoint, mint }],
    queryFn: async () => {
      if (!mint) return null;
      return getAsset(mint, connection);
    },
    enabled: !!mint,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });
}
