import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, Professional } from "@/src/api/client";
import { StarRating } from "@/src/components/StarRating";
import { useSession } from "@/src/context/SessionContext";
import { colors, radii, spacing } from "@/src/theme";

export default function Favorites() {
  const router = useRouter();
  const { user } = useSession();
  const [items, setItems] = useState<Professional[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const r = await api.get<Professional[]>("/professionals");
        setItems(r.data.filter((p) => user?.favorites?.includes(p.id)));
      })();
    }, [user])
  );

  return (
    <SafeAreaView style={styles.safe} testID="favorites-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="fav-back">
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Favoritos</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.xl, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/professional/${item.id}`)}
            style={styles.row}
            testID={`fav-item-${item.id}`}
          >
            <Image source={{ uri: item.photo }} style={styles.img} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.spec}>{item.specialties.join(" • ")}</Text>
              <StarRating rating={item.rating || 5} size={12} />
            </View>
            <Ionicons name="heart" color={colors.gold} size={20} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Você ainda não favoritou profissionais.
          </Text>
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
  title: { color: colors.white, fontSize: 16, fontWeight: "800" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  img: { width: 60, height: 60, borderRadius: 30 },
  name: { color: colors.white, fontWeight: "700" },
  spec: { color: colors.textSecondary, fontSize: 12, marginVertical: 4 },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: 60 },
});
