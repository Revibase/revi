import { PublicKey } from "@solana/web3.js";
import {
  createContext,
  useContext,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { useGetPrimaryAddress } from "utils/queries/useGetPrimaryAddress";
import { useGetSecondaryAddress } from "utils/queries/useGetSecondaryAddress";

export interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: FC<GlobalProviderProps> = ({ children }) => {
  const { data: primaryAddress } = useGetPrimaryAddress();
  const { data: secondaryData } = useGetSecondaryAddress();
  const [isNfcSheetVisible, setNfcSheetVisible] = useState(false);
  return (
    <GlobalContext.Provider
      value={{
        primaryAddress,
        secondaryAddress: secondaryData?.address,
        subOrganizationId: secondaryData?.subOrganizationId,
        isNfcSheetVisible,
        setNfcSheetVisible,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export interface GlobalContextState {
  primaryAddress: PublicKey | null | undefined;
  secondaryAddress: PublicKey | null | undefined;
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
