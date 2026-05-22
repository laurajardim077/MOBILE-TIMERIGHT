import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/src/theme";

export function StarRating({
  rating,
  size = 14,
  showValue = true,
}: {
  rating: number;
  size?: number;
  showValue?: boolean;
}) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <View style={styles.row}>
      {Array.from({ length: full }).map((_, i) => (
        <Ionicons key={`f${i}`} name="star" size={size} color={colors.gold} />
      ))}
      {half && <Ionicons name="star-half" size={size} color={colors.gold} />}
      {Array.from({ length: empty }).map((_, i) => (
        <Ionicons
          key={`e${i}`}
          name="star-outline"
          size={size}
          color={colors.textDisabled}
        />
      ))}
      {showValue && <Text style={styles.value}>{rating.toFixed(1)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
  value: { color: colors.white, marginLeft: 6, fontSize: 12, fontWeight: "600" },
});
