import { AlertCircle, CheckCircle, Info } from "@tamagui/lucide-icons";
import { Toast, useToastState } from "@tamagui/toast";
import { Text, useTheme, XStack, YStack } from "tamagui";

// Define a mapping for icons and colors based on the preset
const presetStyles = {
  success: {
    icon: CheckCircle,
    borderColor: "$green10",
    textColor: "$green12",
  },
  error: {
    icon: AlertCircle,
    borderColor: "$red10",
    textColor: "$red12",
  },
  info: {
    icon: Info,
    borderColor: "$blue10",
    textColor: "$blue12",
  },
};

export function CurrentToast() {
  const currentToast = useToastState();
  const theme = useTheme();
  if (!currentToast || currentToast.isHandledNatively) return null;

  const preset = currentToast.customData?.preset || "info";
  const {
    icon: Icon,
    borderColor,
    textColor,
  } = presetStyles[preset] || presetStyles.info;

  return (
    <Toast
      key={currentToast.id}
      duration={currentToast.duration}
      enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
      exitStyle={{ opacity: 0, scale: 1, y: -20 }}
      y={0}
      opacity={1}
      scale={1}
      animation="quick"
      viewportName={currentToast.viewportName}
      backgroundColor={theme.background}
      borderColor={borderColor}
      borderWidth={"$1"}
    >
      <YStack padding="$2" backgroundColor={theme.background} width="90%">
        <XStack alignItems="center" gap="$2">
          <Icon color={textColor} size={24} />
          <Text numberOfLines={1} color={textColor} fontSize="$4">
            {currentToast.title}
          </Text>
        </XStack>
        {!!currentToast.message && (
          <Text numberOfLines={1} color="$color11" fontSize={"$3"}>
            {currentToast.message}
          </Text>
        )}
      </YStack>
    </Toast>
  );
}
