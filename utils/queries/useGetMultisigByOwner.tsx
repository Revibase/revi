import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { program } from "utils/program";

export function useGetMultisigByOwner({
  address,
}: {
  address: PublicKey | null | undefined;
}) {
  return useQuery({
    queryKey: [
      "get-multisig-by-owner",
      { address: address?.toString() || null },
    ],
    queryFn: async () => {
      if (!address) return null;
      const accounts = await program.account.multiWallet.all([
        {
          memcmp: {
            offset: 111,
            bytes: address.toString(),
          },
        },
      ]);
      return accounts;
    },
    enabled: !!address,
  });
}
