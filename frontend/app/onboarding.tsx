import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/src/components/Button";
import { storage } from "@/src/utils/storage";
import { colors, spacing } from "@/src/theme";

const { width } = Dimensions.get("window");

const slides = [
  {
    title: "Beleza sob medida",
    subtitle:
      "Agende serviços premium de cabelo, unhas, maquiagem e spa com os melhores profissionais.",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Horários sem conflito",
    subtitle:
      "Reserva em tempo real, com confirmação instantânea e lembretes automáticos.",
    image:
      "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  {
    title: "Programa de fidelidade",
    subtitle: "Acumule pontos a cada agendamento e troque por descontos exclusivos.",
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const next = async () => {
    if (index < slides.length - 1) {
      const ni = index + 1;
      setIndex(ni);
      scrollRef.current?.scrollTo({ x: width * ni, animated: true });
    } else {
      await storage.setItem("onboarding_seen", true);
      router.replace("/(auth)/sign-in");
    }
  };

  const skip = async () => {
    await storage.setItem("onboarding_seen", true);
    router.replace("/(auth)/sign-in");
  };

  return (
    <SafeAreaView style={styles.container} testID="onboarding-screen">
      <View style={styles.topRow}>
        <Text style={styles.brand}>TimeRight</Text>
        <Text style={styles.skip} onPress={skip} testID="onboarding-skip">
          Pular
        </Text>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
      >
        {slides.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <Image source={{ uri: s.image }} style={styles.image} />
            <View style={styles.overlay} />
            <View style={styles.textBlock}>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.subtitle}>{s.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
      <View style={styles.cta}>
        <Button
          label={index === slides.length - 1 ? "Começar" : "Próximo"}
          onPress={next}
          testID="onboarding-next"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  brand: { color: colors.gold, fontSize: 18, fontWeight: "700", letterSpacing: 1 },
  skip: { color: colors.textSecondary, fontSize: 14 },
  slide: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  image: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,10,10,0.55)",
  },
  textBlock: { padding: spacing.xl, marginBottom: 80 },
  title: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.gold, width: 24 },
  cta: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
