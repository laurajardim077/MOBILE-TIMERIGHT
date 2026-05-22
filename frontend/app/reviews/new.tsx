import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/src/api/client";
import { Button } from "@/src/components/Button";
import { colors, radii, spacing } from "@/src/theme";

export default function NewReview() {
  const router = useRouter();
  const { booking_id } = useLocalSearchParams<{ booking_id: string }>();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!booking_id) return;
    setLoading(true);
    try {
      await api.post(`/bookings/${booking_id}/complete`).catch(() => {});
      await api.post("/reviews", { booking_id, rating, comment });
      Alert.alert("Obrigado!", "Sua avaliação foi enviada. Ganhe +5 pontos ✨", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Erro", e?.response?.data?.detail || "Falha ao avaliar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="review-new-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="review-back">
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Avaliar atendimento</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Como foi sua experiência?</Text>
        <Text style={styles.subtitle}>Toque nas estrelas para classificar</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              onPress={() => setRating(n)}
              testID={`review-star-${n}`}
            >
              <Ionicons
                name={n <= rating ? "star" : "star-outline"}
                size={44}
                color={colors.gold}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.subTitle}>Comentário</Text>
        <TextInput
          placeholder="Conte como foi..."
          placeholderTextColor={colors.textSecondary}
          value={comment}
          onChangeText={setComment}
          style={styles.input}
          multiline
          testID="review-comment"
        />
        <View style={{ marginTop: spacing.xl }}>
          <Button
            label="Enviar avaliação"
            onPress={submit}
            loading={loading}
            testID="review-submit"
          />
        </View>
      </View>
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
  headerTitle: { color: colors.white, fontWeight: "800", fontSize: 16 },
  content: { padding: spacing.xl, gap: 12 },
  title: { color: colors.white, fontSize: 24, fontWeight: "800", marginTop: 12 },
  subtitle: { color: colors.textSecondary, fontSize: 13 },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: spacing.xl,
  },
  subTitle: { color: colors.white, fontWeight: "700", marginTop: 8 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
    color: colors.white,
    minHeight: 120,
    textAlignVertical: "top",
  },
});
