import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { TurnkeyClient } from "@turnkey/http";
import { PasskeyStamper } from "@turnkey/react-native-passkey-stamper";

const passKeyStamper = new PasskeyStamper({
  rpId: process.env.EXPO_PUBLIC_RPID,
});

const apiKeystamper = new ApiKeyStamper({
  apiPublicKey: process.env.EXPO_PUBLIC_TURNKEY_API_PUBLIC_KEY,
  apiPrivateKey: process.env.EXPO_PUBLIC_TURNKEY_API_PRIVATE_KEY,
});

export enum StamperType {
  PASSKEY,
  APIKEY,
}
export const turnKeyClient = (type: StamperType) => {
  return new TurnkeyClient(
    { baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL },
    type === StamperType.PASSKEY ? passKeyStamper : apiKeystamper
  );
};
