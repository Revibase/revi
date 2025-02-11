import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRef } from "react";
import { Alert, Platform } from "react-native";
import {
  EscrowActions,
  logError,
  NotificationPayload,
  Page,
  saveExpoPushToken,
  useGlobalStore,
  WalletType,
} from "utils";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
export const useNotifications = () => {
  const {
    setExpoPushToken,
    setWalletSheetArgs,
    expoPushToken,
    deviceWalletPublicKey,
    cloudWalletPublicKey,
  } = useGlobalStore();

  const responseListener = useRef<Notifications.EventSubscription>();
  const queryClient = useQueryClient();

  const initializeNotification = () => {
    registerForPushNotificationsAsync()
      .then((token) => {
        if (!!token && token !== expoPushToken) {
          if (deviceWalletPublicKey) {
            saveExpoPushToken([deviceWalletPublicKey], token);
          }
          if (cloudWalletPublicKey) {
            saveExpoPushToken([cloudWalletPublicKey], token);
          }
        }
        setExpoPushToken(token ?? null);
      })
      .catch(() => setExpoPushToken(null));

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
          const payload = response.notification.request.content.data as {
            type: EscrowActions;
            data: any;
            walletAddress: string;
            metadata: string | null;
          };
          if (payload) {
            switch (payload.type) {
              case EscrowActions.InitializeEscrowAsNonOwner ||
                EscrowActions.AcceptEscrowAsOwner ||
                EscrowActions.CancelEscrowAsOwner:
                setWalletSheetArgs({
                  type: WalletType.MULTIWALLET,
                  walletAddress: payload.walletAddress,
                  mint: payload.metadata ?? null,
                  theme: "accent",
                  offer: payload.data,
                  page: Page.Offer,
                });
            }
          }
        }
      );

    return () => {
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  };

  const sendPushNotification = async ({
    expoPushToken,
    title,
    body,
    data,
  }: NotificationPayload) => {
    const message = {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data,
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  };

  function handleRegistrationError(errorMessage: string) {
    logError(new Error(errorMessage));
    Alert.alert(errorMessage);
    throw new Error(errorMessage);
  }

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        handleRegistrationError(
          "Permission not granted to get push token for push notification!"
        );
        return;
      }
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      if (!projectId) {
        handleRegistrationError("Project ID not found");
      }
      try {
        const pushTokenString = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;

        return pushTokenString;
      } catch (e: unknown) {
        handleRegistrationError(`${e}`);
      }
    } else {
      handleRegistrationError(
        "Must use physical device for push notifications"
      );
    }
  }

  return {
    initializeNotification,
    sendPushNotification,
  };
};
