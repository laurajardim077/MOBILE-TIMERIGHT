import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/src/components/Button";
import { Input } from "@/src/components/Input";
import { useSession } from "@/src/context/SessionContext";
import { colors, spacing } from "@/src/theme";

export default function ForgotPassword() {
  const router = useRouter();
  const { forgotPassword } = useSession();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.includes("@")) {
      setMessage("Informe um e-mail válido");
      return;
    }
    try {
      setLoading(true);
      const msg = await forgotPassword(email.trim().toLowerCase());
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="forgot-password-screen">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="forgot-back">
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Recuperar senha</Text>
          <Text style={styles.subtitle}>
            Enviaremos um link de recuperação para o seu e-mail.
          </Text>
          <Input
            label="E-mail"
            placeholder="seu@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            testID="forgot-email"
          />
          {message && (
            <View style={styles.msgBox}>
              <Ionicons name="information-circle" size={18} color={colors.gold} />
              <Text style={styles.msg}>{message}</Text>
            </View>
          )}
          <View style={{ marginTop: spacing.lg }}>
            <Button
              label="Enviar link"
              onPress={onSubmit}
              loading={loading}
              testID="forgot-submit"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl },
  back: { marginBottom: 16, alignSelf: "flex-start" },
  title: { color: colors.white, fontSize: 28, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginBottom: spacing.xl },
  msgBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.1)",
    borderColor: colors.gold,
    borderWidth: 1,
  },
  msg: { color: colors.white, flex: 1, fontSize: 13 },
});
