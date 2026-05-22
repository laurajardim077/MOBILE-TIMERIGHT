import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSession } from "@/src/context/SessionContext";
import { storage } from "@/src/utils/storage";
import { colors } from "@/src/theme";

export default function SplashScreen() {
  const router = useRouter();
  const { loading, user } = useSession();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    scale.value = withDelay(150, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, []);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(async () => {
      if (user) {
        router.replace("/(tabs)");
        return;
      }
      const seen = await storage.getItem<boolean>("onboarding_seen", false);
      if (seen) {
        router.replace("/(auth)/sign-in");
      } else {
        router.replace("/onboarding");
      }
    }, 1300);
    return () => clearTimeout(t);
  }, [loading, user]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container} testID="splash-screen">
      <Animated.View style={[styles.brandWrap, animatedStyle]}>
        <View style={styles.logoCircle}>
          <Ionicons name="time" size={48} color={colors.black} />
        </View>
        <Text style={styles.brand}>TimeRight</Text>
        <Text style={styles.tagline}>Beleza no momento certo</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  brandWrap: { alignItems: "center", gap: 12 },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gold,
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 6 },
  },
  brand: {
    color: colors.white,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 16,
  },
  tagline: { color: colors.gold, fontSize: 14, letterSpacing: 2, textTransform: "uppercase" },
});
