import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, Notif, Professional, Service } from "@/src/api/client";
import { StarRating } from "@/src/components/StarRating";
import { useSession } from "@/src/context/SessionContext";
import { colors, radii, spacing } from "@/src/theme";

export default function Home() {
  const router = useRouter();
  const { user, refreshMe } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [pros, setPros] = useState<Professional[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, p, n] = await Promise.all([
        api.get<Service[]>("/services"),
        api.get<Professional[]>("/professionals"),
        api.get<Notif[]>("/notifications"),
      ]);
      setServices(s.data);
      setPros(p.data);
      setNotifs(n.data);
      await refreshMe();
    } finally {
      setLoading(false);
    }
  }, [refreshMe]);

  useEffect(() => {
    load();
  }, [load]);

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.safe} testID="home-screen" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.gold}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greet}>Olá, {user?.name?.split(" ")[0]}</Text>
            <Text style={styles.subgreet}>O que vamos agendar hoje?</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            style={styles.bellWrap}
            testID="home-notifications-btn"
          >
            <Ionicons name="notifications" size={22} color={colors.white} />
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/services")}
          style={styles.banner}
          testID="home-banner"
        >
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
            }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTag}>EXCLUSIVO</Text>
            <Text style={styles.bannerTitle}>Experiência premium{"\n"}TimeRight</Text>
            <View style={styles.bannerCta}>
              <Text style={styles.bannerCtaText}>Reservar agora</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.black} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Loyalty */}
        <View style={styles.loyaltyCard} testID="home-loyalty">
          <View style={styles.loyaltyLeft}>
            <Ionicons name="diamond" size={24} color={colors.gold} />
            <View>
              <Text style={styles.loyaltyLabel}>Seus pontos</Text>
              <Text style={styles.loyaltyValue}>{user?.loyalty_points ?? 0}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.loyaltyHint}>Acumule e troque por descontos</Text>
          </View>
        </View>

        {/* Services */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Serviços em destaque</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/services")}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={services.slice(0, 6)}
          keyExtractor={(i) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.svcCard}
              onPress={() => router.push(`/service/${item.id}`)}
              testID={`home-service-${item.id}`}
            >
              <Image source={{ uri: item.image }} style={styles.svcImg} />
              <View style={styles.svcInfo}>
                <Text style={styles.svcCat}>{item.category}</Text>
                <Text style={styles.svcName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.svcPrice}>R$ {item.price.toFixed(0)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Pros */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profissionais</Text>
        </View>
        <FlatList
          data={pros}
          keyExtractor={(i) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.proCard}
              onPress={() => router.push(`/professional/${item.id}`)}
              testID={`home-pro-${item.id}`}
            >
              <Image source={{ uri: item.photo }} style={styles.proImg} />
              <Text style={styles.proName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.proSpec} numberOfLines={1}>
                {item.specialties.join(" • ")}
              </Text>
              <StarRating rating={item.rating || 5} size={12} />
            </TouchableOpacity>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  greet: { color: colors.white, fontSize: 22, fontWeight: "800" },
  subgreet: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  bellWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingHorizontal: 5,
    minWidth: 16,
    alignItems: "center",
  },
  badgeText: { color: colors.black, fontSize: 10, fontWeight: "800" },
  banner: {
    marginHorizontal: spacing.xl,
    height: 180,
    borderRadius: radii.xl,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bannerContent: { flex: 1, padding: spacing.lg, justifyContent: "space-between" },
  bannerTag: {
    alignSelf: "flex-start",
    color: colors.gold,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    borderColor: colors.gold,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bannerTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 30,
  },
  bannerCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    alignSelf: "flex-start",
  },
  bannerCtaText: { color: colors.black, fontWeight: "800", fontSize: 13 },
  loyaltyCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  loyaltyLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  loyaltyLabel: { color: colors.textSecondary, fontSize: 12, textTransform: "uppercase" },
  loyaltyValue: { color: colors.white, fontSize: 22, fontWeight: "800" },
  loyaltyHint: { color: colors.textSecondary, fontSize: 11, maxWidth: 140, textAlign: "right" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: "700" },
  seeAll: { color: colors.gold, fontSize: 13 },
  hList: { paddingHorizontal: spacing.xl, gap: 12, paddingBottom: spacing.lg },
  svcCard: {
    width: 180,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  svcImg: { width: "100%", height: 110 },
  svcInfo: { padding: 12, gap: 4 },
  svcCat: { color: colors.gold, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  svcName: { color: colors.white, fontSize: 14, fontWeight: "700" },
  svcPrice: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  proCard: {
    width: 140,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  proImg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  proName: { color: colors.white, fontSize: 13, fontWeight: "700" },
  proSpec: { color: colors.textSecondary, fontSize: 10, textAlign: "center" },
});
