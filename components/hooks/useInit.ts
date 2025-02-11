import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useCallback } from "react";
import { Alert, Platform } from "react-native";
import {
  CloudStorage,
  CloudStorageProvider,
  CloudStorageScope,
} from "react-native-cloud-storage";
import {
  getCloudWalletPublicKey,
  getDeviceWalletPublicKey,
  logError,
  useGlobalStore,
} from "utils";
GoogleSignin.configure({
  scopes: ["https://www.googleapis.com/auth/drive.appdata"],
  webClientId:
    "1018601631301-89osm7fs8708uegkimf0lb7kbe40mfcl.apps.googleusercontent.com",
});
export const useInit = () => {
  const {
    defaultWallet,
    setDefaultWallet,
    setCloudStorage,
    deviceWalletPublicKey,
    setDeviceWalletPublicKey,
    cloudWalletPublicKey,
    setCloudWalletPublicKey,
  } = useGlobalStore();

  const addToken = (token: string | null) => {
    let cloudStorage: CloudStorage | null = null;

    if (Platform.OS === "android" || (Platform.OS === "ios" && token)) {
      if (token) {
        const storage = new CloudStorage(CloudStorageProvider.GoogleDrive, {
          scope: CloudStorageScope.AppData,
        });
        storage.setProviderOptions({ accessToken: token });
        cloudStorage = storage;
      }
    } else if (Platform.OS === "ios" && !__DEV__) {
      cloudStorage = new CloudStorage(CloudStorageProvider.ICloud, {
        scope: CloudStorageScope.AppData,
      });
    }
    setCloudStorage(cloudStorage);
    return cloudStorage;
  };

  const initializeCloudWallet = useCallback(async () => {
    let cloudStorage: CloudStorage | null = null;
    const previouslySignedIn = GoogleSignin.hasPreviousSignIn();
    if (previouslySignedIn) {
      const response = await GoogleSignin.signInSilently();
      if (response.type === "success") {
        const tokens = await GoogleSignin.getTokens();
        cloudStorage = addToken(tokens.accessToken);
      } else {
        cloudStorage = addToken(null);
      }
    } else {
      cloudStorage = addToken(null);
    }
    try {
      const result = await getCloudWalletPublicKey(cloudStorage);
      setCloudWalletPublicKey(result);
    } catch (error) {
      setCloudWalletPublicKey(null);
      logError(error);
    }
  }, []);

  const initializeDefaultWallet = useCallback(async () => {
    let newDefaultWallet: string | null | undefined = null;

    if (defaultWallet) {
      if (deviceWalletPublicKey?.toString() === defaultWallet) {
        newDefaultWallet = deviceWalletPublicKey;
      } else if (cloudWalletPublicKey?.toString() === defaultWallet) {
        newDefaultWallet = cloudWalletPublicKey;
      }
    }
    if (!newDefaultWallet) {
      newDefaultWallet = deviceWalletPublicKey || cloudWalletPublicKey;
    }
    if (defaultWallet !== newDefaultWallet) {
      setDefaultWallet(newDefaultWallet);
    }
  }, [defaultWallet, deviceWalletPublicKey, cloudWalletPublicKey]);

  const initializeDeviceWallet = useCallback(async () => {
    try {
      const result = await getDeviceWalletPublicKey();
      setDeviceWalletPublicKey(result);
    } catch (error) {
      setDeviceWalletPublicKey(null);
      logError(error);
    }
  }, [deviceWalletPublicKey, setDeviceWalletPublicKey]);

  const handleSignInWithGoogle = async () => {
    try {
      const response = await GoogleSignin.signIn();
      if (response.type === "success") {
        const tokens = await GoogleSignin.getTokens();
        addToken(tokens.accessToken);
      }
    } catch (error) {
      logError(error);
      Alert.alert(
        "Google Sign-In Error:",
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  return {
    handleSignInWithGoogle,
    initializeCloudWallet,
    initializeDeviceWallet,
    initializeDefaultWallet,
  };
};
