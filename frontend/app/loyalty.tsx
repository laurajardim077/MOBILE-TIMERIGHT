import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "@/src/context/SessionContext";
import { colors, radii, spacing } from "@/src/theme";

const TIERS = [
  { name: "Bronze", min: 0, color: "#A87132" },
  { name: "Prata", min: 200, color: "#C0C0C0" },
  { name: "Ouro", min: 500, color: "#D4AF37" },
  { name: "Diamante", min: 1000, color: "#9DEEFB" },
];

export default function Loyalty() {
  const router = useRouter();
  const { user } = useSession();
  const points = user?.loyalty_points ?? 0;
  const currentTier =
    [...TIERS].reverse().find((t) => points >= t.min) || TIERS[0];
  const nextTier = TIERS.find((t) => points < t.min);
  const progress = nextTier
    ? ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  return (
    <SafeAreaView style={styles.safe} testID="loyalty-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="loyalty-back">
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Programa de fidelidade</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: 16 }}>
        <View style={[styles.card, { borderColor: currentTier.color }]}>
          <Ionicons name="diamond" size={36} color={currentTier.color} />
          <Text style={styles.tierName}>{currentTier.name}</Text>
          <Text style={styles.pointsBig}>{points} pontos</Text>
          <View style={styles.progressOuter}>
            <View
              style={[
                styles.progressInner,
                { width: `${Math.min(progress, 100)}%`, backgroundColor: currentTier.color },
              ]}
            />
          </View>
          {nextTier ? (
            <Text style={styles.next}>
              Faltam {nextTier.min - points} pontos para {nextTier.name}
            </Text>
          ) : (
            <Text style={styles.next}>Você é nosso cliente Diamante! 💎</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Como acumular</Text>
        {[
          { icon: "calendar", text: "+10 pontos a cada agendamento" },
          { icon: "star", text: "+5 pontos a cada avaliação" },
          { icon: "person-add", text: "+50 pontos ao indicar uma amiga" },
        ].map((it, i) => (
          <View key={i} style={styles.tip}>
            <Ionicons name={it.icon as any} size={20} color={colors.gold} />
            <Text style={styles.tipText}>{it.text}</Text>
          </View>
        ))}
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
  title: { color: colors.white, fontSize: 16, fontWeight: "800" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 2,
    gap: 8,
  },
  tierName: { color: colors.white, fontSize: 22, fontWeight: "800", letterSpacing: 1 },
  pointsBig: { color: colors.gold, fontSize: 36, fontWeight: "800" },
  progressOuter: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: "hidden",
    marginTop: 8,
  },
  progressInner: { height: "100%", borderRadius: 4 },
  next: { color: colors.textSecondary, fontSize: 12, marginTop: 6 },
  sectionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
    marginTop: spacing.lg,
  },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipText: { color: colors.white, fontSize: 14 },
});
