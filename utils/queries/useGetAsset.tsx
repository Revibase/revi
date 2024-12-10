import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";
import { getAsset } from "../helper";

export function useGetAsset({ mint }: { mint: PublicKey | undefined }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ["get-asset", { mint, endpoint: connection.rpcEndpoint }],
    queryFn: async () => {
      if (!mint) return null;
      return getAsset(mint, connection);
    },
    staleTime: 1000 * 60 * 15,
    enabled: !!mint,
  });
}
