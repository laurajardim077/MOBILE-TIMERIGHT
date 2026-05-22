import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, Notif } from "@/src/api/client";
import { colors, radii, spacing } from "@/src/theme";

const ICONS: Record<string, any> = {
  booking_confirmed: "checkmark-circle",
  reminder: "alarm",
  cancellation: "close-circle",
  promo: "gift",
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const r = await api.get<Notif[]>("/notifications");
    setItems(r.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    await api.post("/notifications/read-all");
    load();
  };

  return (
    <SafeAreaView style={styles.safe} testID="notifications-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="notif-back">
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Notificações</Text>
        <TouchableOpacity onPress={markAll} testID="notif-mark-read">
          <Text style={styles.readAll}>Marcar lidas</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.xl, gap: 10 }}
        renderItem={({ item }) => (
          <View style={[styles.item, !item.read && styles.itemUnread]}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={ICONS[item.type] || "notifications"}
                size={18}
                color={colors.gold}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody}>{item.body}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>Nenhuma notificação ainda.</Text>
          ) : null
        }
      />
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
  title: { color: colors.white, fontWeight: "800", fontSize: 18 },
  readAll: { color: colors.gold, fontSize: 13 },
  item: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radii.lg,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemUnread: { borderColor: colors.gold },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: { color: colors.white, fontWeight: "700", fontSize: 14 },
  itemBody: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: 60 },
});
