import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
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

export default function SignIn() {
  const router = useRouter();
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email.includes("@")) {
      setError("Informe um e-mail válido");
      return;
    }
    if (password.length < 6) {
      setError("Senha deve ter ao menos 6 caracteres");
      return;
    }
    try {
      setLoading(true);
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="sign-in-screen">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logo}>
              <Ionicons name="time" size={32} color={colors.black} />
            </View>
            <Text style={styles.title}>Bem-vinda de volta</Text>
            <Text style={styles.subtitle}>
              Entre para acessar seus agendamentos
            </Text>
          </View>

          {error && (
            <View style={styles.errorBox} testID="sign-in-error">
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input
            label="E-mail"
            placeholder="seu@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            testID="sign-in-email"
          />
          <View>
            <Input
              label="Senha"
              placeholder="Sua senha"
              secureTextEntry={!showPw}
              value={password}
              onChangeText={setPassword}
              testID="sign-in-password"
            />
            <TouchableOpacity
              style={styles.eye}
              onPress={() => setShowPw((s) => !s)}
              testID="sign-in-toggle-pw"
            >
              <Ionicons
                name={showPw ? "eye-off" : "eye"}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity testID="sign-in-forgot">
              <Text style={styles.forgot}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </Link>

          <View style={{ marginTop: spacing.lg }}>
            <Button
              label="Entrar"
              onPress={onSubmit}
              loading={loading}
              testID="sign-in-submit"
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem conta? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity testID="sign-in-go-signup">
                <Text style={styles.footerLink}>Criar conta</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl },
  header: { alignItems: "center", marginBottom: spacing.xxl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { color: colors.white, fontSize: 28, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: colors.textSecondary, fontSize: 14 },
  eye: { position: "absolute", right: 14, top: 38 },
  forgot: {
    color: colors.gold,
    textAlign: "right",
    marginTop: -8,
    marginBottom: spacing.lg,
    fontSize: 13,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xxl,
  },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  footerLink: { color: colors.gold, fontSize: 14, fontWeight: "700" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: colors.error,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },
});
