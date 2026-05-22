import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, Professional, Service } from "@/src/api/client";
import { Button } from "@/src/components/Button";
import { StarRating } from "@/src/components/StarRating";
import { colors, radii, spacing } from "@/src/theme";

export default function ServiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [pros, setPros] = useState<Professional[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const s = await api.get<Service>(`/services/${id}`);
      setService(s.data);
      const p = await api.get<Professional[]>("/professionals", {
        params: { service_id: id },
      });
      setPros(p.data);
    })();
  }, [id]);

  if (!service) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="service-detail-screen">
      <Image source={{ uri: service.image }} style={styles.cover} />
      <View style={styles.overlay} />
      <SafeAreaView style={styles.topBar} edges={["top"]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="service-back">
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>
      </SafeAreaView>
      <ScrollView style={styles.sheet} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.cat}>{service.category.toUpperCase()}</Text>
        <Text style={styles.name}>{service.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={16} color={colors.gold} />
            <Text style={styles.metaText}>{service.duration_minutes} min</Text>
          </View>
          <Text style={styles.price}>R$ {service.price.toFixed(2)}</Text>
        </View>
        <Text style={styles.desc}>{service.description}</Text>

        <Text style={styles.sectionTitle}>Profissionais</Text>
        {pros.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.proRow}
            onPress={() => router.push(`/professional/${p.id}`)}
            testID={`service-pro-${p.id}`}
          >
            <Image source={{ uri: p.photo }} style={styles.proImg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.proName}>{p.name}</Text>
              <Text style={styles.proSpec}>{p.specialties.join(" • ")}</Text>
              <StarRating rating={p.rating || 5} size={12} />
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <SafeAreaView edges={["bottom"]} style={styles.cta}>
        <Button
          label="Agendar agora"
          onPress={() =>
            router.push(`/booking/new?service_id=${service.id}`)
          }
          testID="service-book-cta"
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { width: "100%", height: 320, position: "absolute", top: 0 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  topBar: { padding: spacing.lg, flexDirection: "row" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    marginTop: 260,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
  },
  cat: { color: colors.gold, letterSpacing: 2, fontSize: 11 },
  name: { color: colors.white, fontSize: 26, fontWeight: "800", marginVertical: 6 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: colors.white, fontSize: 14 },
  price: { color: colors.gold, fontSize: 22, fontWeight: "800" },
  desc: { color: colors.textSecondary, lineHeight: 22, fontSize: 14 },
  sectionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  proRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radii.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  proImg: { width: 50, height: 50, borderRadius: 25 },
  proName: { color: colors.white, fontWeight: "700" },
  proSpec: { color: colors.textSecondary, fontSize: 12, marginVertical: 2 },
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: 10,
    backgroundColor: colors.bg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
});
