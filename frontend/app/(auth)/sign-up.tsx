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

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError("Informe seu nome");
      return;
    }
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
      await signUp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        cpf: cpf.trim() || undefined,
      });
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="sign-up-screen">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="sign-up-back">
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>
            Ganhe 100 pontos de boas-vindas ao se cadastrar ✨
          </Text>

          {error && (
            <View style={styles.errorBox} testID="sign-up-error">
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input
            label="Nome completo"
            placeholder="Como devemos chamar você"
            value={name}
            onChangeText={setName}
            testID="sign-up-name"
          />
          <Input
            label="E-mail"
            placeholder="seu@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            testID="sign-up-email"
          />
          <Input
            label="Telefone (opcional)"
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            testID="sign-up-phone"
          />
          <Input
            label="CPF (opcional)"
            placeholder="000.000.000-00"
            keyboardType="number-pad"
            value={cpf}
            onChangeText={setCpf}
            testID="sign-up-cpf"
          />
          <Input
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            testID="sign-up-password"
          />

          <View style={{ marginTop: spacing.lg }}>
            <Button
              label="Criar conta"
              onPress={onSubmit}
              loading={loading}
              testID="sign-up-submit"
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem conta? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity testID="sign-up-go-signin">
                <Text style={styles.footerLink}>Entrar</Text>
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
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  back: { marginBottom: 16, alignSelf: "flex-start" },
  title: { color: colors.white, fontSize: 28, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginBottom: spacing.xl },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
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
