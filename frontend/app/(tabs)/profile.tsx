import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "@/src/context/SessionContext";
import { colors, radii, spacing } from "@/src/theme";

export default function Profile() {
  const router = useRouter();
  const { user, signOut, updateProfile } = useSession();
  const [uploading, setUploading] = useState(false);

  const pickPhoto = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Disponível no app", "Use o app no celular para alterar a foto.");
      return;
    }
    const ImagePicker = await import("expo-image-picker");
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permissão necessária",
        "Para alterar sua foto, permita o acesso à galeria nas configurações."
      );
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (r.canceled || !r.assets?.[0]) return;
    const asset = r.assets[0];
    const dataUrl = `data:image/jpeg;base64,${asset.base64}`;
    try {
      setUploading(true);
      await updateProfile({ photo: dataUrl });
    } catch (e: any) {
      Alert.alert("Erro", e?.response?.data?.detail || "Falha ao enviar foto");
    } finally {
      setUploading(false);
    }
  };

  const items = [
    {
      icon: "person-outline" as const,
      label: "Editar perfil",
      onPress: () => router.push("/edit-profile"),
      testID: "profile-edit",
    },
    {
      icon: "heart-outline" as const,
      label: "Profissionais favoritos",
      onPress: () => router.push("/favorites"),
      testID: "profile-favorites",
    },
    {
      icon: "pricetags-outline" as const,
      label: "Meus cupons",
      onPress: () => router.push("/coupons"),
      testID: "profile-coupons",
    },
    {
      icon: "diamond-outline" as const,
      label: "Programa de fidelidade",
      onPress: () => router.push("/loyalty"),
      testID: "profile-loyalty",
    },
    {
      icon: "location-outline" as const,
      label: "Localização do salão",
      onPress: () => router.push("/salon"),
      testID: "profile-salon",
    },
    {
      icon: "notifications-outline" as const,
      label: "Notificações",
      onPress: () => router.push("/notifications"),
      testID: "profile-notifications",
    },
    {
      icon: "settings-outline" as const,
      label: "Configurações",
      onPress: () => router.push("/settings"),
      testID: "profile-settings",
    },
  ];

  return (
    <SafeAreaView style={styles.safe} testID="profile-screen" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={pickPhoto} style={styles.avatarWrap} testID="profile-avatar">
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color={colors.black} />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user?.loyalty_points ?? 0}</Text>
              <Text style={styles.statLabel}>Pontos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user?.favorites?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Favoritos</Text>
            </View>
          </View>
        </View>

        <View style={styles.menu}>
          {items.map((it, i) => (
            <TouchableOpacity
              key={i}
              style={styles.menuItem}
              onPress={it.onPress}
              testID={it.testID}
            >
              <View style={styles.menuLeft}>
                <View style={styles.iconBox}>
                  <Ionicons name={it.icon} size={18} color={colors.gold} />
                </View>
                <Text style={styles.menuLabel}>{it.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logout} onPress={signOut} testID="profile-logout">
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: "center", padding: spacing.xl, gap: 8 },
  avatarWrap: { width: 96, height: 96 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: colors.gold },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.gold,
  },
  avatarText: { color: colors.gold, fontSize: 36, fontWeight: "800" },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.bg,
  },
  name: { color: colors.white, fontSize: 20, fontWeight: "800", marginTop: 6 },
  email: { color: colors.textSecondary, fontSize: 13 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: { alignItems: "center", paddingHorizontal: 24 },
  statValue: { color: colors.gold, fontSize: 22, fontWeight: "800" },
  statLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border },
  menu: { paddingHorizontal: spacing.xl, gap: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { color: colors.white, fontSize: 14, fontWeight: "600" },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.xl,
    padding: 14,
  },
  logoutText: { color: colors.error, fontSize: 14, fontWeight: "700" },
});
