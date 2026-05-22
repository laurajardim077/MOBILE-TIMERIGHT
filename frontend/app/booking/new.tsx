import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, Booking, Coupon, Professional, Service } from "@/src/api/client";
import { Button } from "@/src/components/Button";
import { colors, radii, spacing } from "@/src/theme";

type Step = 1 | 2 | 3 | 4;

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function BookingNew() {
  const router = useRouter();
  const { service_id, pro_id } = useLocalSearchParams<{
    service_id?: string;
    pro_id?: string;
  }>();
  const [step, setStep] = useState<Step>(service_id ? 2 : 1);
  const [services, setServices] = useState<Service[]>([]);
  const [pros, setPros] = useState<Professional[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [pro, setPro] = useState<Professional | null>(null);
  const [date, setDate] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState<string>("");
  const [coupon, setCoupon] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // initial load
  useEffect(() => {
    (async () => {
      const [s, c] = await Promise.all([
        api.get<Service[]>("/services"),
        api.get<Coupon[]>("/coupons"),
      ]);
      setServices(s.data);
      setCoupons(c.data);
      if (service_id) {
        const found = s.data.find((x) => x.id === service_id);
        if (found) setService(found);
      }
    })();
  }, [service_id]);

  // load pros when service selected
  useEffect(() => {
    if (!service) return;
    (async () => {
      const p = await api.get<Professional[]>("/professionals", {
        params: { service_id: service.id },
      });
      setPros(p.data);
      if (pro_id) {
        const found = p.data.find((x) => x.id === pro_id);
        if (found) {
          setPro(found);
          setStep(3);
        }
      }
    })();
  }, [service, pro_id]);

  // load slots when date+pro+service set
  const loadSlots = useCallback(async () => {
    if (!service || !pro || !date) return;
    setLoadingSlots(true);
    try {
      const r = await api.get<{ slots: string[] }>("/availability", {
        params: { professional_id: pro.id, service_id: service.id, date },
      });
      setSlots(r.data.slots);
    } finally {
      setLoadingSlots(false);
    }
  }, [service, pro, date]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const finalPrice = useMemo(() => {
    if (!service) return 0;
    if (!coupon) return service.price;
    const c = coupons.find((x) => x.code === coupon.toUpperCase());
    if (!c) return service.price;
    if (service.price < c.min_value) return service.price;
    return service.price - service.price * (c.discount_percent / 100);
  }, [service, coupon, coupons]);

  const confirm = async () => {
    if (!service || !pro || !date || !time) return;
    setLoading(true);
    try {
      const r = await api.post<Booking>("/bookings", {
        service_id: service.id,
        professional_id: pro.id,
        date,
        time,
        coupon_code: coupon ? coupon.toUpperCase() : undefined,
        notes: notes || undefined,
      });
      router.replace(`/booking/confirmation?booking_id=${r.data.id}`);
    } catch (e: any) {
      Alert.alert("Erro", e?.response?.data?.detail || "Falha ao agendar");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const minDate = new Date(today.getTime() + 12 * 60 * 60 * 1000);

  return (
    <SafeAreaView style={styles.safe} testID="booking-new-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} testID="booking-back">
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Novo agendamento</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Steps indicator */}
      <View style={styles.steps}>
        {[1, 2, 3, 4].map((n) => (
          <View
            key={n}
            style={[styles.stepDot, n <= step && styles.stepDotActive]}
          />
        ))}
      </View>
      <Text style={styles.stepLabel}>
        {step === 1 && "1/4 · Escolha o serviço"}
        {step === 2 && "2/4 · Escolha a profissional"}
        {step === 3 && "3/4 · Data e horário"}
        {step === 4 && "4/4 · Confirme os detalhes"}
      </Text>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>
        {step === 1 && (
          <View style={{ gap: 10 }}>
            {services.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.option,
                  service?.id === s.id && styles.optionActive,
                ]}
                onPress={() => setService(s)}
                testID={`booking-svc-${s.id}`}
              >
                <Image source={{ uri: s.image }} style={styles.optImg} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optName}>{s.name}</Text>
                  <Text style={styles.optMeta}>
                    {s.duration_minutes} min • R$ {s.price.toFixed(2)}
                  </Text>
                </View>
                {service?.id === s.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.gold} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: 10 }}>
            {pros.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.option, pro?.id === p.id && styles.optionActive]}
                onPress={() => setPro(p)}
                testID={`booking-pro-${p.id}`}
              >
                <Image source={{ uri: p.photo }} style={styles.optImgRound} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optName}>{p.name}</Text>
                  <Text style={styles.optMeta}>
                    {p.specialties.join(" • ")} · ★ {p.rating || 5}
                  </Text>
                </View>
                {pro?.id === p.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.gold} />
                )}
              </TouchableOpacity>
            ))}
            {pros.length === 0 && (
              <Text style={styles.helperText}>
                Nenhum profissional disponível para este serviço.
              </Text>
            )}
          </View>
        )}

        {step === 3 && (
          <View>
            <Calendar
              minDate={fmt(minDate)}
              onDayPress={(d) => {
                setDate(d.dateString);
                setTime("");
              }}
              markedDates={
                date
                  ? {
                      [date]: {
                        selected: true,
                        selectedColor: colors.gold,
                      },
                    }
                  : {}
              }
              theme={{
                calendarBackground: colors.surface,
                dayTextColor: colors.white,
                monthTextColor: colors.white,
                textDisabledColor: colors.textDisabled,
                arrowColor: colors.gold,
                todayTextColor: colors.gold,
                selectedDayTextColor: colors.black,
                selectedDayBackgroundColor: colors.gold,
                textSectionTitleColor: colors.textSecondary,
              }}
              style={styles.calendar}
            />
            {date && (
              <View>
                <Text style={styles.subTitle}>
                  Horários disponíveis em {date}
                </Text>
                {loadingSlots ? (
                  <Text style={styles.helperText}>Carregando...</Text>
                ) : slots.length === 0 ? (
                  <Text style={styles.helperText}>
                    Sem horários disponíveis nesta data.
                  </Text>
                ) : (
                  <View style={styles.slots}>
                    {slots.map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setTime(s)}
                        style={[styles.slot, time === s && styles.slotActive]}
                        testID={`booking-slot-${s}`}
                      >
                        <Text
                          style={[
                            styles.slotText,
                            time === s && styles.slotTextActive,
                          ]}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {step === 4 && service && pro && (
          <View style={{ gap: 12 }}>
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Serviço</Text>
              <Text style={styles.summaryValue}>{service.name}</Text>
            </View>
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Profissional</Text>
              <Text style={styles.summaryValue}>{pro.name}</Text>
            </View>
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Data & hora</Text>
              <Text style={styles.summaryValue}>
                {date} às {time}
              </Text>
            </View>
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Duração</Text>
              <Text style={styles.summaryValue}>{service.duration_minutes} min</Text>
            </View>

            <Text style={styles.subTitle}>Cupom (opcional)</Text>
            <TextInput
              placeholder="Digite o cupom"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="characters"
              value={coupon}
              onChangeText={setCoupon}
              style={styles.input}
              testID="booking-coupon"
            />
            <Text style={styles.helperText}>
              Sugestão: BEMVINDA10, BELEZA20, FIDELIDADE15
            </Text>

            <Text style={styles.subTitle}>Observações (opcional)</Text>
            <TextInput
              placeholder="Ex.: alergias, preferências..."
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, { height: 80 }]}
              multiline
              testID="booking-notes"
            />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {finalPrice.toFixed(2)}</Text>
            </View>
            {finalPrice < service.price && (
              <Text style={styles.discountText}>
                Você economiza R$ {(service.price - finalPrice).toFixed(2)} 🎉
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.cta}>
        {step > 1 && (
          <Button
            label="Voltar"
            variant="secondary"
            onPress={() => setStep((s) => (s - 1) as Step)}
            style={{ flex: 1 }}
            fullWidth={false}
            testID="booking-prev"
          />
        )}
        {step < 4 && (
          <Button
            label={
              step === 1
                ? "Continuar"
                : step === 2
                ? "Continuar"
                : "Continuar"
            }
            onPress={() => setStep((s) => (s + 1) as Step)}
            disabled={
              (step === 1 && !service) ||
              (step === 2 && !pro) ||
              (step === 3 && (!date || !time))
            }
            style={{ flex: 1 }}
            fullWidth={false}
            testID="booking-next"
          />
        )}
        {step === 4 && (
          <Button
            label="Confirmar agendamento"
            onPress={confirm}
            loading={loading}
            style={{ flex: 1 }}
            fullWidth={false}
            testID="booking-confirm"
          />
        )}
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.white, fontWeight: "700", fontSize: 16 },
  steps: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingTop: spacing.lg,
  },
  stepDot: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.border },
  stepDotActive: { backgroundColor: colors.gold },
  stepLabel: {
    color: colors.gold,
    textAlign: "center",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: { borderColor: colors.gold, backgroundColor: colors.surfaceAlt },
  optImg: { width: 60, height: 60, borderRadius: 12 },
  optImgRound: { width: 60, height: 60, borderRadius: 30 },
  optName: { color: colors.white, fontWeight: "700", fontSize: 14 },
  optMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  helperText: { color: colors.textSecondary, textAlign: "center", marginTop: spacing.md, fontSize: 12 },
  calendar: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderColor: colors.border,
    borderWidth: 1,
  },
  subTitle: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  slotText: { color: colors.white, fontSize: 13, fontWeight: "600" },
  slotTextActive: { color: colors.black, fontWeight: "800" },
  summary: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: { color: colors.textSecondary, fontSize: 12 },
  summaryValue: { color: colors.white, fontWeight: "700", fontSize: 14, maxWidth: "60%", textAlign: "right" },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 12,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(212,175,55,0.08)",
    padding: 14,
    borderRadius: radii.md,
    marginTop: spacing.md,
    borderColor: colors.gold,
    borderWidth: 1,
  },
  totalLabel: { color: colors.white, fontSize: 14, fontWeight: "700" },
  totalValue: { color: colors.gold, fontSize: 22, fontWeight: "800" },
  discountText: { color: colors.success, fontSize: 12, textAlign: "right" },
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: 10,
    backgroundColor: colors.bg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
  },
});
