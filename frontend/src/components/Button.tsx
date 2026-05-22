import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { colors, radii } from "@/src/theme";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
  testID,
  fullWidth = true,
}: Props) {
  const isDisabled = disabled || loading;
  const containerStyle = [
    styles.base,
    fullWidth && { alignSelf: "stretch" as const },
    variant === "primary" && styles.primary,
    variant === "secondary" && styles.secondary,
    variant === "outline" && styles.outline,
    isDisabled && styles.disabled,
    style,
  ];
  const textStyle = [
    styles.text,
    variant === "primary" && styles.primaryText,
    variant === "secondary" && styles.secondaryText,
    variant === "outline" && styles.outlineText,
  ];

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.black : colors.gold}
        />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: "transparent",
  },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontWeight: "700" },
  primaryText: { color: colors.black },
  secondaryText: { color: colors.white },
  outlineText: { color: colors.gold },
});
