import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { api, Booking } from "@/src/api/client";
import { Button } from "@/src/components/Button";
import { colors, radii, spacing } from "@/src/theme";

export default function Confirmation() {
  const router = useRouter();
  const { booking_id } = useLocalSearchParams<{ booking_id: string }>();
  const [b, setB] = useState<Booking | null>(null);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!booking_id) return;
    api.get<Booking>(`/bookings/${booking_id}`).then((r) => setB(r.data));
    scale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.back(2)) });
    opacity.value = withDelay(300, withTiming(1, { duration: 400 }));
  }, [booking_id]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <SafeAreaView style={styles.safe} testID="booking-confirmation-screen">
      <View style={styles.center}>
        <Animated.View style={[styles.check, checkStyle]}>
          <Ionicons name="checkmark" size={56} color={colors.black} />
        </Animated.View>
        <Animated.View style={contentStyle}>
          <Text style={styles.title}>Agendamento confirmado!</Text>
          <Text style={styles.subtitle}>
            Você receberá lembretes nas notificações.
          </Text>
        </Animated.View>

        {b && (
          <Animated.View style={[styles.card, contentStyle]}>
            <Image source={{ uri: b.professional_photo }} style={styles.photo} />
            <Text style={styles.svc}>{b.service_name}</Text>
            <Text style={styles.detail}>com {b.professional_name}</Text>
            <View style={styles.row}>
              <Ionicons name="calendar" size={14} color={colors.gold} />
              <Text style={styles.detail}>{b.date}</Text>
              <Ionicons name="time-outline" size={14} color={colors.gold} />
              <Text style={styles.detail}>{b.time}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={styles.price}>R$ {b.final_price.toFixed(2)}</Text>
            </View>
          </Animated.View>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          label="Ver meus agendamentos"
          onPress={() => router.replace("/(tabs)/bookings")}
          testID="confirm-go-bookings"
        />
        <Button
          label="Voltar ao início"
          variant="secondary"
          onPress={() => router.replace("/(tabs)")}
          testID="confirm-go-home"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  check: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gold,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
  },
  title: { color: colors.white, fontSize: 24, fontWeight: "800", textAlign: "center" },
  subtitle: { color: colors.textSecondary, textAlign: "center", marginTop: 6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: "center",
    width: "100%",
    marginTop: spacing.xl,
    borderColor: colors.border,
    borderWidth: 1,
    gap: 6,
  },
  photo: { width: 64, height: 64, borderRadius: 32, marginBottom: 6 },
  svc: { color: colors.white, fontSize: 18, fontWeight: "800" },
  detail: { color: colors.textSecondary, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    width: "100%",
  },
  priceLabel: { color: colors.textSecondary, fontSize: 13 },
  price: { color: colors.gold, fontSize: 20, fontWeight: "800" },
  actions: { gap: 10 },
});
