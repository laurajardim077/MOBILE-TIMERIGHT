import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, Booking } from "@/src/api/client";
import { colors, radii, spacing } from "@/src/theme";

export default function Bookings() {
  const router = useRouter();
  const [scope, setScope] = useState<"upcoming" | "past">("upcoming");
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (s: "upcoming" | "past") => {
    setLoading(true);
    try {
      const r = await api.get<Booking[]>("/bookings", { params: { scope: s } });
      setItems(r.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(scope);
    }, [scope, load])
  );

  const cancel = async (b: Booking) => {
    Alert.alert("Cancelar agendamento?", `${b.service_name} em ${b.date} às ${b.time}`, [
      { text: "Voltar", style: "cancel" },
      {
        text: "Cancelar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.post(`/bookings/${b.id}/cancel`);
            await load(scope);
          } catch (e: any) {
            Alert.alert("Erro", e?.response?.data?.detail || "Não foi possível cancelar");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Booking }) => {
    const isCancelled = item.status === "cancelled";
    const isCompleted = item.status === "completed";
    return (
      <View style={styles.card} testID={`booking-card-${item.id}`}>
        <Image source={{ uri: item.professional_photo }} style={styles.photo} />
        <View style={styles.cardBody}>
          <Text style={styles.svc}>{item.service_name}</Text>
          <Text style={styles.pro}>com {item.professional_name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="calendar" size={12} color={colors.gold} />
            <Text style={styles.metaText}>{item.date}</Text>
            <Ionicons name="time-outline" size={12} color={colors.gold} />
            <Text style={styles.metaText}>{item.time}</Text>
          </View>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                isCancelled
                  ? styles.bgCancel
                  : isCompleted
                  ? styles.bgDone
                  : styles.bgConf,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isCancelled
                    ? styles.statusCancel
                    : isCompleted
                    ? styles.statusDone
                    : styles.statusConf,
                ]}
              >
                {isCancelled ? "Cancelado" : isCompleted ? "Concluído" : "Confirmado"}
              </Text>
            </View>
            <Text style={styles.price}>R$ {item.final_price.toFixed(2)}</Text>
          </View>
          <View style={styles.actions}>
            {scope === "upcoming" && !isCancelled && (
              <TouchableOpacity
                onPress={() => cancel(item)}
                style={styles.actionBtn}
                testID={`booking-cancel-${item.id}`}
              >
                <Ionicons name="close-circle-outline" size={14} color={colors.error} />
                <Text style={[styles.actionText, { color: colors.error }]}>Cancelar</Text>
              </TouchableOpacity>
            )}
            {scope === "past" && isCompleted && !item.rated && (
              <TouchableOpacity
                onPress={() => router.push(`/reviews/new?booking_id=${item.id}`)}
                style={styles.actionBtn}
                testID={`booking-rate-${item.id}`}
              >
                <Ionicons name="star" size={14} color={colors.gold} />
                <Text style={[styles.actionText, { color: colors.gold }]}>Avaliar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} testID="bookings-screen" edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus agendamentos</Text>
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setScope("upcoming")}
          style={[styles.tab, scope === "upcoming" && styles.tabActive]}
          testID="bookings-tab-upcoming"
        >
          <Text style={[styles.tabText, scope === "upcoming" && styles.tabTextActive]}>
            Próximos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setScope("past")}
          style={[styles.tab, scope === "past" && styles.tabActive]}
          testID="bookings-tab-past"
        >
          <Text style={[styles.tabText, scope === "past" && styles.tabTextActive]}>
            Histórico
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={colors.textDisabled} />
              <Text style={styles.emptyText}>
                {scope === "upcoming"
                  ? "Nenhum agendamento próximo."
                  : "Nenhum atendimento anterior."}
              </Text>
              {scope === "upcoming" && (
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/services")}
                  style={styles.emptyBtn}
                  testID="bookings-empty-cta"
                >
                  <Text style={styles.emptyBtnText}>Agendar agora</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.xl },
  title: { color: colors.white, fontSize: 28, fontWeight: "800" },
  tabs: {
    flexDirection: "row",
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radii.pill },
  tabActive: { backgroundColor: colors.gold },
  tabText: { color: colors.textSecondary, fontWeight: "700", fontSize: 13 },
  tabTextActive: { color: colors.black },
  list: { padding: spacing.xl, gap: 12, paddingBottom: spacing.xxl },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  photo: { width: 60, height: 60, borderRadius: 30 },
  cardBody: { flex: 1, gap: 4 },
  svc: { color: colors.white, fontSize: 15, fontWeight: "700" },
  pro: { color: colors.textSecondary, fontSize: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  metaText: { color: colors.textSecondary, fontSize: 12, marginRight: 6 },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  bgConf: { backgroundColor: "rgba(16,185,129,0.15)" },
  bgCancel: { backgroundColor: "rgba(239,68,68,0.15)" },
  bgDone: { backgroundColor: "rgba(212,175,55,0.15)" },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  statusConf: { color: colors.success },
  statusCancel: { color: colors.error },
  statusDone: { color: colors.gold },
  price: { color: colors.gold, fontWeight: "800", fontSize: 14 },
  actions: { flexDirection: "row", gap: 12, marginTop: 6 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { fontSize: 11, fontWeight: "700" },
  empty: { alignItems: "center", marginTop: 40, gap: 16 },
  emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: "center" },
  emptyBtn: {
    backgroundColor: colors.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
  emptyBtnText: { color: colors.black, fontWeight: "800" },
});
