import { PublicKey } from "@solana/web3.js";
import { createContext, useContext, type FC, type ReactNode } from "react";
import { useGetCloudAddress } from "utils/queries/useGetCloudPublicKey";
import { useGetDeviceAddress } from "utils/queries/useGetDevicePublicKey";

export interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: FC<OnboardingProviderProps> = ({
  children,
}) => {
  const { data: deviceAddress } = useGetDeviceAddress();
  const { data: cloudAddress } = useGetCloudAddress();

  return (
    <OnboardingContext.Provider value={{ deviceAddress, cloudAddress }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export interface OnboardingContextState {
  deviceAddress: PublicKey | null | undefined;
  cloudAddress: PublicKey | null | undefined;
}

export const OnboardingContext = createContext<OnboardingContextState>(
  {} as OnboardingContextState
);

export function useOnboarding(): OnboardingContextState {
  return useContext(OnboardingContext);
}
