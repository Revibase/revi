import { getApp, ReactNativeFirebase } from "@react-native-firebase/app";
import { firebase } from "@react-native-firebase/app-check";
import crashlytics from "@react-native-firebase/crashlytics";
import {
  FirebaseFirestoreTypes,
  getFirestore,
} from "@react-native-firebase/firestore";
import { Platform } from "react-native";
import {
  PasskeyCreateRequest,
  PasskeyCreateResult,
  PasskeyGetRequest,
  PasskeyGetResult,
} from "react-native-passkey";

export const logError = (error: any) => {
  crashlytics().recordError(
    error instanceof Error ? error : new Error(String(error))
  );
};

export const log = (message: string) => {
  crashlytics().log(message);
};

export const db = () => {
  if (!firestore) {
    throw new Error("Firestore is not initialized yet.");
  }
  return firestore;
};
let firestore: FirebaseFirestoreTypes.Module | null = null;

const initialize = async (app: ReactNativeFirebase.FirebaseApp) => {
  try {
    const provider = firebase
      .appCheck(app)
      .newReactNativeFirebaseAppCheckProvider();
    provider.configure({
      android: {
        provider:
          process.env.EAS_BUILD_PROFILE === "production"
            ? "playIntegrity"
            : "debug",
        debugToken: process.env.EXPO_PUBLIC_DEBUG_TOKEN,
      },
      apple: {
        provider: "appAttestWithDeviceCheckFallback",
      },
    });
    await firebase.appCheck(app).initializeAppCheck({
      isTokenAutoRefreshEnabled: true,
      provider,
    });
  } catch (error) {
    logError(error);
  } finally {
    firestore = getFirestore(app);
    firestore.settings({ ignoreUndefinedProperties: true });
  }
};
initialize(getApp());

export const saveExpoPushToken = async (
  wallets: string[],
  expoPushToken: string | null
) => {
  const appCheckToken = await getAppCheckToken();
  const payload = cleanPayload({ wallets, expoPushToken });
  const res = await fetch("https://saveexpopushtoken-tyweccihhq-uc.a.run.app", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Firebase-AppCheck": appCheckToken,
    },
    body: JSON.stringify(payload),
  });
  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || `Request failed with status ${res.status}`);
  }
};

export const registerPasskey = async (username: string) => {
  const appCheckToken = await getAppCheckToken();
  const payload = cleanPayload({ username });
  const res = await fetch("https://registerpasskey-tyweccihhq-uc.a.run.app", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Firebase-AppCheck": appCheckToken,
    },
    body: JSON.stringify(payload),
  });
  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || `Request failed with status ${res.status}`);
  }
  return result as { options: PasskeyCreateRequest; requestId: string };
};

export const verifyPasskeyRegistration = async ({
  requestId,
  response,
}: {
  requestId: string;
  response: PasskeyCreateResult;
}) => {
  const appCheckToken = await getAppCheckToken();
  const payload = cleanPayload({ requestId, response });
  const res = await fetch(
    "https://verifypasskeyregistration-tyweccihhq-uc.a.run.app",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Firebase-AppCheck": appCheckToken,
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || `Request failed with status ${res.status}`);
  }
  return result as { success: boolean; publicKey: string };
};

export const generatePasskeyAuthentication = async ({
  publicKey,
}: {
  publicKey?: string;
}) => {
  const appCheckToken = await getAppCheckToken();
  const payload = cleanPayload({ publicKey });
  const res = await fetch(
    "https://generatepasskeyauthentication-tyweccihhq-uc.a.run.app/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Firebase-AppCheck": appCheckToken,
      },
      body: JSON.stringify(payload),
    }
  );
  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || `Request failed with status ${res.status}`);
  }

  const request = result as { options: PasskeyGetRequest; requestId: string };

  if (Platform.OS === "ios" && request.options.allowCredentials?.length) {
    request.options.allowCredentials = request.options.allowCredentials.map(
      ({ transports, ...rest }) => rest
    );
  }
  return request;
};

export const authenticatePasskey = async ({
  response,
  requestId,
  publicKey,
  userId,
  payload,
}: {
  requestId: string;
  response: PasskeyGetResult;
  publicKey?: string;
  userId?: string;
  payload?: string[];
}) => {
  const appCheckToken = await getAppCheckToken();
  const body = cleanPayload({
    publicKey,
    userId,
    response,
    payload,
    requestId,
  });
  const res = await fetch(
    "https://authenticatepasskey-tyweccihhq-uc.a.run.app",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Firebase-AppCheck": appCheckToken,
      },
      body: JSON.stringify(body),
    }
  );

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || `Request failed with status ${res.status}`);
  }
  return result as {
    success: boolean;
    signatures: string[];
    publicKey: string;
  };
};

const cleanPayload = (payload: Record<string, any>) => {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([_, value]) => value !== undefined && value !== null
    )
  );
};

export const getAppCheckToken = async () => {
  const result = await firebase.appCheck().getToken();
  return result.token;
};
