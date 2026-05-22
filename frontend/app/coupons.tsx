import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, Coupon } from "@/src/api/client";
import { colors, radii, spacing } from "@/src/theme";

export default function Coupons() {
  const router = useRouter();
  const [items, setItems] = useState<Coupon[]>([]);

  useEffect(() => {
    api.get<Coupon[]>("/coupons").then((r) => setItems(r.data));
  }, []);

  const copy = async (code: string) => {
    try {
      await Clipboard.setStringAsync?.(code);
    } catch {
      // ignore
    }
    Alert.alert("Cupom copiado!", `Use ${code} ao agendar`);
  };

  return (
    <SafeAreaView style={styles.safe} testID="coupons-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="coupons-back">
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Meus cupons</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.xl, gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.tag}>
              <Text style={styles.discount}>{item.discount_percent}%</Text>
              <Text style={styles.off}>OFF</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.code}>{item.code}</Text>
              <Text style={styles.desc}>{item.description}</Text>
            </View>
            <TouchableOpacity
              onPress={() => copy(item.code)}
              style={styles.copy}
              testID={`coupon-copy-${item.code}`}
            >
              <Ionicons name="copy-outline" size={16} color={colors.black} />
              <Text style={styles.copyText}>Copiar</Text>
            </TouchableOpacity>
          </View>
        )}
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
  title: { color: colors.white, fontSize: 16, fontWeight: "800" },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 14,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tag: {
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.md,
    alignItems: "center",
  },
  discount: { color: colors.black, fontSize: 18, fontWeight: "800" },
  off: { color: colors.black, fontSize: 10, fontWeight: "800" },
  code: { color: colors.white, fontSize: 16, fontWeight: "800", letterSpacing: 1 },
  desc: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  copy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  copyText: { color: colors.black, fontSize: 11, fontWeight: "800" },
});
