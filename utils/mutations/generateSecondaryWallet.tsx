import { PublicKey } from "@solana/web3.js";
import { useToastController } from "@tamagui/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TurnkeyClient } from "@turnkey/http";
import {
  createPasskey,
  isSupported,
} from "@turnkey/react-native-passkey-stamper";
import * as Keychain from "react-native-keychain";
import { APP_IDENTIFIER } from "utils/consts";
import { StamperType, turnKeyClient } from "utils/turnkey";

export enum Flow {
  Login,
  SignUp,
}

export function useGenerateSecondaryWallet() {
  const client = useQueryClient();
  const turnkey = turnKeyClient(StamperType.APIKEY);
  const toast = useToastController();
  return useMutation({
    mutationKey: ["generate-secondary-wallet"],
    mutationFn: async ({
      flow,
      userName,
    }: {
      flow: Flow;
      userName: string;
    }) => {
      try {
        if (!isSupported()) {
          throw new Error("Passkey is not supported on this device!");
        }

        let subOrganizationId: string | undefined;
        let address: PublicKey | null = null;
        if (flow === Flow.Login) {
          const result = await getSubOrganizationFromPasskey();
          if (result) {
            subOrganizationId = result;
            address = await getWalletAddress(turnkey, subOrganizationId);
          } else {
            throw new Error(
              "Selected Passkey does not have an existing account."
            );
          }
        } else {
          const authenticatorParams = await createPasskey({
            authenticatorName: "End-User Passkey",
            rp: {
              id: process.env.EXPO_PUBLIC_RPID,
              name: "Horizon",
            },
            user: {
              id: Buffer.from(String(Date.now())).toString("base64"),
              name: userName,
              displayName: userName,
            },
            authenticatorSelection: {
              residentKey: "preferred",
              requireResidentKey: false,
              userVerification: "preferred",
            },
          });
          const response = await createSubOrganization(
            turnkey,
            userName,
            authenticatorParams
          );
          subOrganizationId =
            response.activity.result.createSubOrganizationResultV7
              ?.subOrganizationId;
          const walletId =
            response.activity.result.createSubOrganizationResultV7?.wallet
              ?.walletId;
          address = await getWalletAddress(
            turnkey,
            subOrganizationId,
            walletId
          );
        }
        if (subOrganizationId && address) {
          await saveSecondaryWalletData(subOrganizationId, address);
          return true;
        }
        return false;
      } catch (error: any) {
        console.log(error);
        toast.show("Error", {
          message: `${error.message}`,
          customData: {
            preset: "error",
          },
        });
        return false;
      }
    },
    onSuccess: async (result) => {
      if (result) {
        await Promise.all([
          await client.invalidateQueries({
            queryKey: ["get-secondary-address"],
          }),
        ]);
      }
    },
  });
}

async function getSubOrganizationFromPasskey() {
  const result = await turnKeyClient(StamperType.PASSKEY).getWhoami({
    organizationId: process.env.EXPO_PUBLIC_TURNKEY_ORGANIZATION_ID,
  });

  return result.organizationId;
}

async function createSubOrganization(
  client: TurnkeyClient,
  userName: string,
  authenticatorParams: Awaited<ReturnType<typeof createPasskey>>
) {
  const response = await client.createSubOrganization({
    type: "ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION_V7",
    timestampMs: String(Date.now()),
    organizationId: process.env.EXPO_PUBLIC_TURNKEY_ORGANIZATION_ID,
    parameters: {
      subOrganizationName: `Sub-organization at ${String(Date.now())}`,
      rootQuorumThreshold: 1,
      rootUsers: [
        {
          userName,
          apiKeys: [],
          authenticators: [authenticatorParams],
          oauthProviders: [],
        },
      ],
      wallet: {
        walletName: "default",
        mnemonicLength: 24,
        accounts: [
          {
            curve: "CURVE_ED25519",
            pathFormat: "PATH_FORMAT_BIP32",
            path: "m/44'/501'/0'/0'",
            addressFormat: "ADDRESS_FORMAT_SOLANA",
          },
        ],
      },
    },
  });
  return response;
}

async function saveSecondaryWalletData(
  subOrganizationId: string,
  address: PublicKey
) {
  await Keychain.setGenericPassword(subOrganizationId, address.toString(), {
    service: `${APP_IDENTIFIER}-SECONDARY`,
    cloudSync: true,
  });
}

async function getWalletAddress(
  client: TurnkeyClient,
  subOrganizationId: string | undefined,
  walletId?: string
) {
  if (!subOrganizationId) {
    return null;
  }
  if (!walletId) {
    const { wallets } = await client.getWallets({
      organizationId: subOrganizationId,
    });
    walletId = wallets.find((x) => x.walletName === "default")?.walletId;
  }
  if (!walletId) {
    return null;
  }

  const pubKey = (
    await client.getWalletAccounts({
      organizationId: subOrganizationId,
      walletId,
    })
  ).accounts.find((x) => x.addressFormat === "ADDRESS_FORMAT_SOLANA")?.address;
  return pubKey ? new PublicKey(pubKey) : null;
}
