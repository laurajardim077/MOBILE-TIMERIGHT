import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, Service } from "@/src/api/client";
import { colors, radii, spacing } from "@/src/theme";

export default function Services() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [active, setActive] = useState<string>("Todos");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const [s, c] = await Promise.all([
        api.get<Service[]>("/services"),
        api.get<{ categories: string[] }>("/services/categories"),
      ]);
      setServices(s.data);
      setCats(["Todos", ...c.data.categories]);
    })();
  }, []);

  const filtered = services.filter(
    (s) =>
      (active === "Todos" || s.category === active) &&
      (!q || s.name.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safe} testID="services-screen" edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Serviços</Text>
        <Text style={styles.subtitle}>Escolha o que sua beleza pede hoje</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          placeholder="Buscar serviço..."
          placeholderTextColor={colors.textSecondary}
          value={q}
          onChangeText={setQ}
          style={styles.search}
          testID="services-search"
        />
      </View>

      <FlatList
        data={cats}
        keyExtractor={(i) => i}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catsList}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setActive(item)}
            style={[styles.cat, active === item && styles.catActive]}
            testID={`services-cat-${item}`}
          >
            <Text style={[styles.catText, active === item && styles.catTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/service/${item.id}`)}
            testID={`services-item-${item.id}`}
          >
            <Image source={{ uri: item.image }} style={styles.img} />
            <View style={styles.info}>
              <Text style={styles.cardCat}>{item.category.toUpperCase()}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.row}>
                <View style={styles.meta}>
                  <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{item.duration_minutes} min</Text>
                </View>
                <Text style={styles.price}>R$ {item.price.toFixed(2)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum serviço encontrado</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { color: colors.white, fontSize: 28, fontWeight: "800" },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: spacing.xl,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderColor: colors.border,
    borderWidth: 1,
  },
  search: { flex: 1, color: colors.white, paddingVertical: 12, fontSize: 14 },
  catsList: { gap: 8, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  cat: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  catText: { color: colors.white, fontSize: 13, fontWeight: "600" },
  catTextActive: { color: colors.black, fontWeight: "800" },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: 12 },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  img: { width: 110, height: 110 },
  info: { flex: 1, padding: 12, justifyContent: "space-between" },
  cardCat: { color: colors.gold, fontSize: 10, letterSpacing: 1 },
  name: { color: colors.white, fontSize: 15, fontWeight: "700", marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: colors.textSecondary, fontSize: 12 },
  price: { color: colors.gold, fontSize: 16, fontWeight: "800" },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: spacing.xl },
});
