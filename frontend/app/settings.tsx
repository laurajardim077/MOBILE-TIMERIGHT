import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "@/src/context/SessionContext";
import { colors, radii, spacing } from "@/src/theme";

export default function Settings() {
  const router = useRouter();
  const { signOut } = useSession();

  return (
    <SafeAreaView style={styles.safe} testID="settings-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="settings-back">
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Configurações</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: 10 }}>
        <Text style={styles.section}>Aparência</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="moon" size={18} color={colors.gold} />
            <Text style={styles.label}>Modo escuro</Text>
          </View>
          <Switch value={true} disabled trackColor={{ true: colors.gold }} thumbColor={colors.white} />
        </View>

        <Text style={styles.section}>Notificações</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="notifications" size={18} color={colors.gold} />
            <Text style={styles.label}>Push notifications</Text>
          </View>
          <Switch value={true} trackColor={{ true: colors.gold }} thumbColor={colors.white} />
        </View>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="mail" size={18} color={colors.gold} />
            <Text style={styles.label}>E-mail marketing</Text>
          </View>
          <Switch value={false} trackColor={{ true: colors.gold }} thumbColor={colors.white} />
        </View>

        <Text style={styles.section}>Conta</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push("/edit-profile")}
          testID="settings-edit"
        >
          <View style={styles.rowLeft}>
            <Ionicons name="person" size={18} color={colors.gold} />
            <Text style={styles.label}>Editar perfil</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={signOut} testID="settings-logout">
          <View style={styles.rowLeft}>
            <Ionicons name="log-out" size={18} color={colors.error} />
            <Text style={[styles.label, { color: colors.error }]}>Sair</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.version}>TimeRight v1.0.0</Text>
      </ScrollView>
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
  title: { color: colors.white, fontWeight: "800", fontSize: 16 },
  section: {
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: spacing.lg,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  label: { color: colors.white, fontSize: 14, fontWeight: "600" },
  version: { color: colors.textDisabled, textAlign: "center", marginTop: 24 },
});
