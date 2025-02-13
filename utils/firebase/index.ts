import { getApp, ReactNativeFirebase } from "@react-native-firebase/app";
import { firebase } from "@react-native-firebase/app-check";
import crashlytics from "@react-native-firebase/crashlytics";
import {
  FirebaseFirestoreTypes,
  getFirestore,
} from "@react-native-firebase/firestore";
import {
  FirebaseFunctionsTypes,
  getFunctions,
  httpsCallable,
} from "@react-native-firebase/functions";

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
let functions: FirebaseFunctionsTypes.Module | null = null;

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
    console.log(error);
    logError(error);
  } finally {
    firestore = getFirestore(app);
    functions = getFunctions(app);
  }
};
initialize(getApp());

export const saveExpoPushToken = async (
  wallets: string[],
  expoPushToken: string | null
) => {
  if (!functions) {
    throw new Error("Firestore is not initialized yet.");
  }
  const saveExpoPushToken = httpsCallable(functions, "saveExpoPushToken");
  await saveExpoPushToken({ wallets, expoPushToken });
};

export const signTransactionsWithPayer = async (
  txs: string[],
  payer: string
) => {
  if (!functions) {
    throw new Error("Firestore is not initialized yet.");
  }
  const signTransactionsCallable = httpsCallable(
    functions,
    "signTransactionsWithPayer"
  );
  const result = await signTransactionsCallable({ txs, payer });
  return result.data as string[];
};
