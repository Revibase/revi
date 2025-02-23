import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useConnection } from "components/providers/connectionProvider";

export function useGetAccountInfo({
  address,
}: {
  address: string | undefined | null;
}) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ["get-account-info", { address }],
    queryFn: async () => {
      if (!address) return null;
      return connection.getAccountInfo(new PublicKey(address));
    },
    enabled: !!address,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60,
  });
}
