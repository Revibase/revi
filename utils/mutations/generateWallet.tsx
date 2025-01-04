import { Keypair, PublicKey } from "@solana/web3.js";
import { useToastController } from "@tamagui/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TurnkeyClient } from "@turnkey/http";
import {
  createPasskey,
  isSupported,
} from "@turnkey/react-native-passkey-stamper";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import * as Keychain from "react-native-keychain";
import { APP_IDENTIFIER } from "utils/consts";
import { WalletFlow, WalletType } from "utils/enums/wallet";
import { StamperType, turnKeyClient } from "utils/turnkey";

export function useGenerateWallet() {
  const client = useQueryClient();
  const toast = useToastController();
  return useMutation({
    mutationKey: ["generate-wallet"],
    mutationFn: async ({
      walletType,
      walletFlow,
      userName,
      mnemonic,
    }: {
      walletType: WalletType;
      walletFlow: WalletFlow;
      mnemonic?: string;
      userName?: string;
    }) => {
      try {
        switch (walletType) {
          case WalletType.DEVICE:
            if (!mnemonic) {
              mnemonic = bip39.generateMnemonic(256);
            }
            const seed = await bip39.mnemonicToSeed(mnemonic);
            const path = "m/44'/501'/0'/0'";
            const derivedSeed = derivePath(path, seed.toString("hex")).key;
            const keypair = Keypair.fromSeed(derivedSeed);
            await Keychain.setGenericPassword(
              mnemonic,
              Buffer.from(keypair.secretKey).toString("hex"),
              {
                service: `${APP_IDENTIFIER}-DEVICE`,
                accessControl:
                  Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
                securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
              }
            );
            return walletType;
          case WalletType.PASSKEY:
            if (!isSupported()) {
              throw new Error("Passkey is not supported on this device!");
            }
            const turnkey = turnKeyClient(StamperType.APIKEY);
            let subOrganizationId: string | undefined;
            let address: PublicKey | null = null;
            if (walletFlow === WalletFlow.UseExisting) {
              const result = await getSubOrganizationFromPasskey();

              if (result) {
                subOrganizationId = result;
                address = await getWalletAddress(turnkey, subOrganizationId);
              } else {
                throw new Error(
                  "Selected Passkey does not have an existing account."
                );
              }
            } else if (userName) {
              const authenticatorParams = await createPasskey({
                authenticatorName: "End-User Passkey",
                rp: {
                  id: process.env.EXPO_PUBLIC_RPID!,
                  name: "Magpie Wallet",
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
              await savePasskeyWalletData(subOrganizationId, address);
              return walletType;
            }
            return;
        }
      } catch (error: any) {
        toast.show("Error", {
          message: error.message,
          customData: { preset: "error" },
        });
        return;
      }
    },
    onSuccess: async (result) => {
      if (result) {
        await Promise.all([
          client.invalidateQueries({
            queryKey: ["get-publickey", { walletType: result }],
          }),
        ]);
      }
    },
  });
}

async function getSubOrganizationFromPasskey() {
  const result = await turnKeyClient(StamperType.PASSKEY).getWhoami({
    organizationId: process.env.EXPO_PUBLIC_TURNKEY_ORGANIZATION_ID!,
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
    organizationId: process.env.EXPO_PUBLIC_TURNKEY_ORGANIZATION_ID!,
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

async function savePasskeyWalletData(
  subOrganizationId: string,
  address: PublicKey
) {
  await Keychain.setGenericPassword(subOrganizationId, address.toString(), {
    service: `${APP_IDENTIFIER}-PASSKEY`,
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
