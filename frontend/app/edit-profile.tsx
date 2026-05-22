import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

export default function EditProfile() {
  const router = useRouter();
  const { user, updateProfile } = useSession();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await updateProfile({ name, phone });
      Alert.alert("Salvo!", "Seus dados foram atualizados.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Erro", e?.response?.data?.detail || "Falha ao salvar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="edit-profile-screen" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="edit-back">
            <Ionicons name="chevron-back" size={22} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Editar perfil</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Input label="Nome" value={name} onChangeText={setName} testID="edit-name" />
          <Input
            label="Telefone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            testID="edit-phone"
          />
          <Input label="E-mail" value={user?.email || ""} editable={false} />
          <View style={{ marginTop: 20 }}>
            <Button
              label="Salvar"
              onPress={save}
              loading={loading}
              testID="edit-save"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.white, fontSize: 16, fontWeight: "800" },
  content: { padding: spacing.xl },
});
