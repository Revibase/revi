import { Action } from "@dialectlabs/blinks-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DAS } from "@revibase/token-transfer";
import { GenericSheetArgs } from "utils/types/genericSheet";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Page } from "../enums";
import { Offer, TransactionSheetArgs, WalletSheetArgs } from "../types";

interface GlobalStoreState {
  deviceWalletPublicKey: string | null | undefined;
  paymasterWalletPublicKey: string | null | undefined;
  isNfcSheetVisible?: boolean;
  transactionSheetArgs?: TransactionSheetArgs | null;
  walletSheetArgs?: WalletSheetArgs | null;
  genericSheetArgs?: GenericSheetArgs | null;
  previousData?: WalletSheetArgs | null;
  isHydrated?: boolean;
  expoPushToken: string | null;
  setExpoPushToken: (expoPushToken: string | null | undefined) => void;
  setDeviceWalletPublicKey: (
    deviceWalletPublicKey: string | null | undefined
  ) => void;
  setPaymasterWalletPublicKey: (
    paymasterWalletPublicKey: string | null | undefined
  ) => void;
  setIsNfcSheetVisible: (isNfcSheetVisible: boolean) => void;
  setTransactionSheetArgs: (
    transactionSheetArgs: TransactionSheetArgs | null
  ) => void;
  setError: (error: string) => void;
  setPreviousData: (previousData: WalletSheetArgs | null) => void;
  setWalletSheetArgs: (WalletSheetArgs: WalletSheetArgs | null) => void;
  setBlink: (blink: Action | undefined) => void;
  setPage: (page: Page) => void;
  setAsset: (
    asset: DAS.GetAssetResponse | null | undefined,
    callback?: () => void
  ) => void;
  setSwapAsset: (swapAsset: DAS.GetAssetResponse | null | undefined) => void;
  setOffer: (offer: Offer | null | undefined) => void;
  setPendingOffersCheck: (pendingOffersCheck: boolean) => void;
  setNoOwnersCheck: (noOwnersCheck: boolean) => void;
  setGenericSheetArgs: (genericSheetArgs: GenericSheetArgs | null) => void;
}

export const useGlobalStore = create<GlobalStoreState>()(
  persist(
    (set) => ({
      deviceWalletPublicKey: undefined,
      paymasterWalletPublicKey: undefined,
      walletSheetArgs: null,
      genericSheetArgs: null,
      isNfcSheetVisible: false,
      transactionSheetArgs: null,
      previousData: null,
      isHydrated: false,
      expoPushToken: null,
      setExpoPushToken: (expoPushToken: string | null | undefined) => {
        set((state) => ({
          ...state,
          expoPushToken,
        }));
      },
      setPreviousData: (previousData: WalletSheetArgs | null) => {
        set((state) => ({
          ...state,
          previousData,
        }));
      },
      setDeviceWalletPublicKey: (
        deviceWalletPublicKey: string | null | undefined
      ) => {
        set((state) => ({
          ...state,
          deviceWalletPublicKey,
        }));
      },

      setPaymasterWalletPublicKey: (
        paymasterWalletPublicKey: string | null | undefined
      ) => {
        set((state) => ({
          ...state,
          paymasterWalletPublicKey: paymasterWalletPublicKey,
        }));
      },

      setTransactionSheetArgs: (
        transactionSheetArgs: TransactionSheetArgs | null
      ) => {
        set((state) => ({
          ...state,
          transactionSheetArgs,
        }));
      },
      setError: (error: string) => {
        set((state) => ({
          transactionSheetArgs: state.transactionSheetArgs
            ? { ...state.transactionSheetArgs, error }
            : state.transactionSheetArgs,
        }));
      },
      setWalletSheetArgs: (walletSheetArgs: WalletSheetArgs | null) => {
        set((state) => ({
          ...state,
          walletSheetArgs,
        }));
      },
      setIsNfcSheetVisible: (isNfcSheetVisible: boolean) => {
        set((state) => ({
          ...state,
          isNfcSheetVisible,
        }));
      },
      setBlink: (blink) => {
        set((state) => ({
          walletSheetArgs: state.walletSheetArgs
            ? { ...state.walletSheetArgs, blink }
            : state.walletSheetArgs,
        }));
      },

      setPage: (page) => {
        set((state) => ({
          walletSheetArgs: state.walletSheetArgs
            ? { ...state.walletSheetArgs, page }
            : state.walletSheetArgs,
        }));
      },
      setOffer: (offer) => {
        set((state) => ({
          walletSheetArgs: state.walletSheetArgs
            ? {
                ...state.walletSheetArgs,
                offer: offer,
              }
            : state.walletSheetArgs,
        }));
      },
      setAsset: (asset, callback) => {
        set((state) => ({
          walletSheetArgs: state.walletSheetArgs
            ? {
                ...state.walletSheetArgs,
                asset,
                callback,
              }
            : state.walletSheetArgs,
        }));
      },
      setSwapAsset: (swapAsset) => {
        set((state) => ({
          walletSheetArgs: state.walletSheetArgs
            ? {
                ...state.walletSheetArgs,
                swapAsset,
              }
            : state.walletSheetArgs,
        }));
      },

      setNoOwnersCheck: (noOwnersCheck) => {
        set((state) => ({
          walletSheetArgs: state.walletSheetArgs
            ? { ...state.walletSheetArgs, noOwnersCheck }
            : state.walletSheetArgs,
        }));
      },

      setPendingOffersCheck: (pendingOffersCheck) => {
        set((state) => ({
          walletSheetArgs: state.walletSheetArgs
            ? { ...state.walletSheetArgs, pendingOffersCheck }
            : state.walletSheetArgs,
        }));
      },
      setGenericSheetArgs: (genericSheetArgs: GenericSheetArgs | null) => {
        set((state) => ({
          ...state,
          genericSheetArgs,
        }));
      },
    }),

    {
      onRehydrateStorage: () => {
        return (state) => {
          if (state) state.isHydrated = true;
        };
      },
      name: "global-store",
      storage: {
        getItem: async (key) => {
          const value = await AsyncStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (key, value) => {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: async (key) => {
          await AsyncStorage.removeItem(key);
        },
      },
      partialize: (state) => ({
        deviceWalletPublicKey: state.deviceWalletPublicKey,
        paymasterWalletPublicKey: state.paymasterWalletPublicKey,
        expoPushToken: state.expoPushToken,
        setSwapAsset: state.setSwapAsset,
        setGenericSheetArgs: state.setGenericSheetArgs,
        setNoOwnersCheck: state.setNoOwnersCheck,
        setPendingOffersCheck: state.setPendingOffersCheck,
        setExpoPushToken: state.setExpoPushToken,
        setOffer: state.setOffer,
        setPreviousData: state.setPreviousData,
        setAsset: state.setAsset,
        setBlink: state.setBlink,
        setDeviceWalletPublicKey: state.setDeviceWalletPublicKey,
        setPaymasterWalletPublicKey: state.setPaymasterWalletPublicKey,
        setIsNfcSheetVisible: state.setIsNfcSheetVisible,
        setTransactionSheetArgs: state.setTransactionSheetArgs,
        setError: state.setError,
        setWalletSheetArgs: state.setWalletSheetArgs,
        setPage: state.setPage,
      }),
    }
  )
);
