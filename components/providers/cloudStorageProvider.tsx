import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import {
  CloudStorage,
  CloudStorageProvider,
  useIsCloudAvailable,
} from "react-native-cloud-storage";

export function CloudProvider({ children }: { children: ReactNode }) {
  const provider = CloudStorage.getDefaultProvider();
  const cloudStorage = useMemo(() => {
    return new CloudStorage(
      provider,
      provider === CloudStorageProvider.GoogleDrive
        ? { strictFilenames: true }
        : undefined
    );
  }, [provider]);

  const cloudAvailable = useIsCloudAvailable(cloudStorage);

  useEffect(() => {
    if (cloudStorage.getProvider() !== CloudStorageProvider.GoogleDrive) return;

    // cloudStorage.setProviderOptions({
    //   accessToken: accessToken.length ? accessToken : null,
    // });
  }, [cloudStorage]);

  return (
    <CloudStorageContext.Provider value={{ cloudStorage, cloudAvailable }}>
      {children}
    </CloudStorageContext.Provider>
  );
}
export interface CloudStorageContextState {
  cloudStorage: CloudStorage;
  cloudAvailable: boolean;
}

export const CloudStorageContext = createContext<CloudStorageContextState>(
  {} as CloudStorageContextState
);

export function useCloudStorage(): CloudStorageContextState {
  return useContext(CloudStorageContext);
}
