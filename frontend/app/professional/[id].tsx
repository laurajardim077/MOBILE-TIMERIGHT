import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, Professional, Review, Service } from "@/src/api/client";
import { Button } from "@/src/components/Button";
import { StarRating } from "@/src/components/StarRating";
import { useSession } from "@/src/context/SessionContext";
import { colors, radii, spacing } from "@/src/theme";

export default function ProfessionalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, refreshMe } = useSession();
  const [pro, setPro] = useState<Professional | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [fav, setFav] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [p, rv, allSvc] = await Promise.all([
      api.get<Professional>(`/professionals/${id}`),
      api.get<Review[]>(`/professionals/${id}/reviews`),
      api.get<Service[]>("/services"),
    ]);
    setPro(p.data);
    setReviews(rv.data);
    setServices(allSvc.data.filter((s) => p.data.service_ids.includes(s.id)));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setFav((user?.favorites ?? []).includes(id || ""));
  }, [user, id]);

  const toggleFav = async () => {
    try {
      await api.post(`/professionals/${id}/favorite`);
      setFav((f) => !f);
      await refreshMe();
    } catch {
      // ignore
    }
  };

  if (!pro) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} testID="pro-detail-screen">
      <Image source={{ uri: pro.photo }} style={styles.cover} />
      <View style={styles.overlay} />
      <SafeAreaView style={styles.topBar} edges={["top"]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="pro-back">
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleFav} style={styles.iconBtn} testID="pro-fav">
          <Ionicons
            name={fav ? "heart" : "heart-outline"}
            size={22}
            color={fav ? colors.gold : colors.white}
          />
        </TouchableOpacity>
      </SafeAreaView>
      <ScrollView style={styles.sheet} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.name}>{pro.name}</Text>
        <View style={styles.row}>
          <StarRating rating={pro.rating || 5} />
          <Text style={styles.count}>({pro.review_count} avaliações)</Text>
        </View>
        <View style={styles.tags}>
          {pro.specialties.map((s) => (
            <View key={s} style={styles.tag}>
              <Text style={styles.tagText}>{s}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.bio}>{pro.bio}</Text>

        <Text style={styles.sectionTitle}>Serviços</Text>
        {services.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.svcRow}
            onPress={() => router.push(`/booking/new?service_id=${s.id}&pro_id=${pro.id}`)}
            testID={`pro-svc-${s.id}`}
          >
            <Image source={{ uri: s.image }} style={styles.svcImg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.svcName}>{s.name}</Text>
              <Text style={styles.svcMeta}>
                {s.duration_minutes} min • R$ {s.price.toFixed(2)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Avaliações</Text>
        {reviews.length === 0 ? (
          <Text style={styles.empty}>Ainda não há avaliações</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.review}>
              <View style={styles.reviewHead}>
                <Text style={styles.reviewer}>{r.user_name}</Text>
                <StarRating rating={r.rating} size={12} showValue={false} />
              </View>
              {!!r.comment && <Text style={styles.reviewText}>{r.comment}</Text>}
            </View>
          ))
        )}
      </ScrollView>
      <SafeAreaView edges={["bottom"]} style={styles.cta}>
        <Button
          label="Agendar com este profissional"
          onPress={() => router.push(`/booking/new?pro_id=${pro.id}`)}
          testID="pro-book-cta"
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { width: "100%", height: 360, position: "absolute", top: 0 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 360,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  topBar: {
    padding: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    marginTop: 300,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
  },
  name: { color: colors.white, fontSize: 26, fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  count: { color: colors.textSecondary, fontSize: 12 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 12 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  tagText: { color: colors.gold, fontSize: 11, fontWeight: "600" },
  bio: { color: colors.textSecondary, lineHeight: 22, fontSize: 14 },
  sectionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  svcRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radii.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  svcImg: { width: 50, height: 50, borderRadius: 8 },
  svcName: { color: colors.white, fontWeight: "700", fontSize: 14 },
  svcMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  review: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radii.md,
    marginBottom: 8,
    borderColor: colors.border,
    borderWidth: 1,
  },
  reviewHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewer: { color: colors.white, fontWeight: "700" },
  reviewText: { color: colors.textSecondary, marginTop: 4, fontSize: 13 },
  empty: { color: colors.textSecondary, textAlign: "center", paddingVertical: 20 },
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
