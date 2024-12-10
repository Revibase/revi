import { useMutation } from "@tanstack/react-query";
import { readSecureElement } from "../commands";
import { Chain } from "../types/chain";

export function useReadSecureElement({ blockchain }: { blockchain: Chain }) {
  return useMutation({
    mutationKey: ["read-secure-element-data", { blockchain }],
    mutationFn: () => {
      return readSecureElement(blockchain);
    },
    onError: (error) => {
      console.error(`Unable to read secure element! ${JSON.stringify(error)}`);
    },
  });
}
