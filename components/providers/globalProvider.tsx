import { PublicKey } from "@solana/web3.js";
import {
  createContext,
  useContext,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { useGetCloudAddress } from "utils/queries/useGetCloudPublicKey";
import { useGetDeviceAddress } from "utils/queries/useGetDevicePublicKey";

export interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: FC<GlobalProviderProps> = ({ children }) => {
  const { data: deviceAddress } = useGetDeviceAddress();
  const { data: cloudAddress } = useGetCloudAddress();
  const [isNfcSheetVisible, setNfcSheetVisible] = useState(false);
  return (
    <GlobalContext.Provider
      value={{
        deviceAddress,
        cloudAddress,
        isNfcSheetVisible,
        setNfcSheetVisible,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export interface GlobalContextState {
  deviceAddress: PublicKey | null | undefined;
  cloudAddress: PublicKey | null | undefined;
  isNfcSheetVisible: boolean;
  setNfcSheetVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GlobalContext = createContext<GlobalContextState>(
  {} as GlobalContextState
);

export function useGlobalVariables(): GlobalContextState {
  return useContext(GlobalContext);
}
