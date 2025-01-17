import firebaseAuth, { signInAnonymously } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import {
  CloudStorage,
  CloudStorageProvider,
  CloudStorageScope,
} from "react-native-cloud-storage";
import { auth } from "utils/firebase";

export interface GlobalProviderProps {
  children: ReactNode;
}

GoogleSignin.configure({
  webClientId:
    "1018601631301-rht4q83v6ocncrcgr35rbkse8m3isc96.apps.googleusercontent.com",
  scopes: ["https://www.googleapis.com/auth/drive.appdata"],
});

export const GlobalProvider: FC<GlobalProviderProps> = ({ children }) => {
  const [isNfcSheetVisible, setNfcSheetVisible] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const cloudStorage = useMemo(() => {
    if (Platform.OS === "android" || (Platform.OS === "ios" && accessToken)) {
      if (accessToken) {
        const storage = new CloudStorage(CloudStorageProvider.GoogleDrive, {
          scope: CloudStorageScope.AppData,
        });
        storage.setProviderOptions({ accessToken });
        return storage;
      } else {
        return null;
      }
    } else {
      return new CloudStorage(CloudStorageProvider.ICloud, {
        scope: CloudStorageScope.AppData,
      });
    }
  }, [accessToken]);

  // Monitor Firebase Auth state
  useEffect(() => {
    const subscriber = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setAccessToken(null);
        signInAnonymously(auth);
      } else {
        if (!user.isAnonymous) {
          await GoogleSignin.signInSilently();
          const tokens = await GoogleSignin.getTokens();
          setAccessToken(tokens.accessToken);
        }
      }
    });
    return subscriber; // Clean up subscription on unmount
  }, []);

  // Google Sign-In logic
  const handleSignInWithGoogle = useCallback(async () => {
    try {
      const { data } = await GoogleSignin.signIn();
      if (!data?.idToken) throw new Error("No ID token found");
      const googleCredential = firebaseAuth.GoogleAuthProvider.credential(
        data.idToken
      );
      await auth.signInWithCredential(googleCredential);
    } catch (error) {
      console.error("Google Sign-In Error:", error.message);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      isNfcSheetVisible,
      setNfcSheetVisible,
      cloudStorage: cloudStorage,
      handleSignInWithGoogle,
    }),
    [isNfcSheetVisible, cloudStorage, handleSignInWithGoogle]
  );

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export interface GlobalContextState {
  isNfcSheetVisible: boolean;
  setNfcSheetVisible: React.Dispatch<React.SetStateAction<boolean>>;
  cloudStorage: CloudStorage | null;
  handleSignInWithGoogle: () => void;
}

export const GlobalContext = createContext<GlobalContextState>(
  {} as GlobalContextState
);

export function useGlobalVariables(): GlobalContextState {
  return useContext(GlobalContext);
}
