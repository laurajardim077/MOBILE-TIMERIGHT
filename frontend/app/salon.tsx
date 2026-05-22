import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/src/api/client";
import { colors, radii, spacing } from "@/src/theme";

type Info = {
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  open_hours: string;
  instagram: string;
};

export default function Salon() {
  const router = useRouter();
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    api.get<Info>("/salon").then((r) => setInfo(r.data));
  }, []);

  if (!info) return null;

  const openMaps = () => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?q=${info.lat},${info.lng}`,
      android: `geo:${info.lat},${info.lng}?q=${info.lat},${info.lng}(${encodeURIComponent(info.name)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${info.lat},${info.lng}`,
    });
    Linking.openURL(url as string);
  };

  const call = () => Linking.openURL(`tel:${info.phone}`);

  return (
    <SafeAreaView style={styles.safe} testID="salon-screen" edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="salon-back">
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{info.name}</Text>
        <View style={{ width: 40 }} />
      </View>
      <Image
        source={{
          uri: `https://staticmap.openstreetmap.de/staticmap.php?center=${info.lat},${info.lng}&zoom=15&size=600x300&markers=${info.lat},${info.lng},red-pushpin`,
        }}
        style={styles.map}
      />
      <View style={styles.content}>
        <View style={styles.row}>
          <Ionicons name="location" size={18} color={colors.gold} />
          <Text style={styles.text}>{info.address}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={18} color={colors.gold} />
          <Text style={styles.text}>{info.open_hours}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="logo-instagram" size={18} color={colors.gold} />
          <Text style={styles.text}>{info.instagram}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={openMaps} style={styles.btn} testID="salon-maps">
            <Ionicons name="navigate" size={18} color={colors.black} />
            <Text style={styles.btnText}>Como chegar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={call} style={[styles.btn, styles.btnAlt]} testID="salon-call">
            <Ionicons name="call" size={18} color={colors.gold} />
            <Text style={[styles.btnText, { color: colors.gold }]}>Ligar</Text>
          </TouchableOpacity>
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
  map: { width: "100%", height: 240 },
  content: { padding: spacing.xl, gap: 14 },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: { color: colors.white, fontSize: 13, flex: 1 },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: radii.pill,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  btnAlt: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.gold },
  btnText: { color: colors.black, fontWeight: "800" },
});
