import { useCallback } from "react";
import { getDeviceWalletPublicKey, logError, useGlobalStore } from "utils";
export const useInit = () => {
  const { deviceWalletPublicKey, setDeviceWalletPublicKey } = useGlobalStore();

  const initializeDeviceWallet = useCallback(async () => {
    try {
      const result = await getDeviceWalletPublicKey();
      setDeviceWalletPublicKey(result);
    } catch (error) {
      setDeviceWalletPublicKey(null);
      logError(error);
    }
  }, [deviceWalletPublicKey, setDeviceWalletPublicKey]);

  return {
    initializeDeviceWallet,
  };
};
