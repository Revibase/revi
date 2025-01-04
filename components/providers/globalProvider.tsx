import { PublicKey } from "@solana/web3.js";
import {
  createContext,
  useContext,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { useGetDevicePublicKey } from "utils/queries/useGetDevicePublicKey";
import { useGetPasskeyPublicKey } from "utils/queries/useGetPasskeyPublicKey";

export interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: FC<GlobalProviderProps> = ({ children }) => {
  const { data: deviceWalletPublicKey } = useGetDevicePublicKey();
  const { data: passkeyWallet } = useGetPasskeyPublicKey();
  const [isNfcSheetVisible, setNfcSheetVisible] = useState(false);

  return (
    <GlobalContext.Provider
      value={{
        deviceWalletPublicKey,
        passkeyWalletPublicKey: passkeyWallet?.address,
        subOrganizationId: passkeyWallet?.subOrganizationId,
        isNfcSheetVisible,
        setNfcSheetVisible,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export interface GlobalContextState {
  deviceWalletPublicKey: PublicKey | null | undefined;
  passkeyWalletPublicKey: PublicKey | null | undefined;
  subOrganizationId: string | undefined;
  isNfcSheetVisible: boolean;
  setNfcSheetVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GlobalContext = createContext<GlobalContextState>(
  {} as GlobalContextState
);

export function useGlobalVariables(): GlobalContextState {
  return useContext(GlobalContext);
}
