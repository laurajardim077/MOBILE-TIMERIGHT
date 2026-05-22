import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors, radii } from "@/src/theme";

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  containerTestID?: string;
};

export function Input({ label, error, containerTestID, ...rest }: Props) {
  return (
    <View style={styles.wrap} testID={containerTestID}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, !!error && styles.inputError]}
        {...rest}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.white,
    fontSize: 15,
  },
  inputError: { borderColor: colors.error },
  error: { color: colors.error, marginTop: 6, fontSize: 12 },
});
