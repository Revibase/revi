import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import * as Keychain from "react-native-keychain";
import { APP_IDENTIFIER } from "utils/consts";
import { StamperType, turnKeyClient } from "utils/turnkey";

export function useGetSecondaryAddress() {
  return useQuery({
    queryKey: ["get-secondary-address"],
    queryFn: async () => {
      try {
        const credentials = await Keychain.getGenericPassword({
          service: `${APP_IDENTIFIER}-SECONDARY`,
          cloudSync: true,
        });
        if (credentials) {
          return {
            subOrganizationId: credentials.username,
            address: new PublicKey(credentials.password),
          };
        }
        return null;
      } catch (error) {
        throw new Error(`${error.message}`);
      }
    },
    staleTime: Infinity,
  });
}

export const signWithSecondaryKeypair = async (
  subOrganizationId: string | undefined,
  pubKey: PublicKey,
  tx: VersionedTransaction
) => {
  if (!subOrganizationId) {
    throw new Error("Unable to sign transaction!");
  }
  const passKeyClient = turnKeyClient(StamperType.PASSKEY);
  const response = await passKeyClient.signRawPayload({
    type: "ACTIVITY_TYPE_SIGN_RAW_PAYLOAD_V2",
    timestampMs: Date.now().toString(),
    organizationId: subOrganizationId,
    parameters: {
      signWith: pubKey.toString(),
      payload: Buffer.from(tx.message.serialize()).toString("hex"),
      encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
      hashFunction: "HASH_FUNCTION_NOT_APPLICABLE",
    },
  });
  const signRawPayloadResult = response.activity.result.signRawPayloadResult;
  if (!signRawPayloadResult) {
    throw new Error("Unable to Sign Transaction!");
  }
  const signature = `${signRawPayloadResult.r}${signRawPayloadResult.s}`;
  return Buffer.from(signature, "hex");
};
