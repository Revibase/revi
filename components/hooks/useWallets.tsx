import AsyncStorage from "@react-native-async-storage/async-storage";
import { PublicKey } from "@solana/web3.js";
import { useGlobalVariables } from "components/providers/globalProvider";
import { useCallback, useEffect, useState } from "react";
import { useGetCloudPublicKey } from "utils/queries/useGetCloudPublicKey";
import { useGetDevicePublicKey } from "utils/queries/useGetDevicePublicKey";

export const useWallets = () => {
  const [defaultWallet, setDefaultWallet] = useState<
    PublicKey | null | undefined
  >();
  const { cloudStorage } = useGlobalVariables();
  const { data: deviceWalletPublicKey, isLoading: deviceWalletIsLoading } =
    useGetDevicePublicKey();
  const { data: cloudWalletPublicKey, isLoading: cloudWalletIsLoading } =
    useGetCloudPublicKey({ cloudStorage });
  const initializeDefaultWallet = useCallback(async () => {
    if (deviceWalletIsLoading || cloudWalletIsLoading) return;

    const storedDefaultWallet = await AsyncStorage.getItem("defaultWallet");

    let newDefaultWallet: PublicKey | null | undefined = null;

    if (storedDefaultWallet) {
      if (deviceWalletPublicKey?.toString() === storedDefaultWallet) {
        newDefaultWallet = deviceWalletPublicKey;
      } else if (cloudWalletPublicKey?.toString() === storedDefaultWallet) {
        newDefaultWallet = cloudWalletPublicKey;
      }
    }

    if (!newDefaultWallet) {
      newDefaultWallet = deviceWalletPublicKey || cloudWalletPublicKey;
    }

    setDefaultWallet(newDefaultWallet);
  }, [
    deviceWalletPublicKey,
    cloudWalletPublicKey,
    deviceWalletIsLoading,
    cloudWalletIsLoading,
  ]);

  useEffect(() => {
    initializeDefaultWallet();
  }, [initializeDefaultWallet]);

  useEffect(() => {
    if (defaultWallet) {
      AsyncStorage.setItem("defaultWallet", defaultWallet.toString());
    }
  }, [defaultWallet]);

  return {
    deviceWalletPublicKey,
    cloudWalletPublicKey,
    deviceWalletIsLoading,
    cloudWalletIsLoading,
    defaultWallet,
    setDefaultWallet,
  };
};
