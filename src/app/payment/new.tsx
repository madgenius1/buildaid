import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, Payment } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type PayType = Payment["type"];

const TYPES: { value: PayType; label: string; icon: string; color: string }[] = [
  { value: "fundi", label: "Fundi", icon: "tool", color: "#8B5CF6" },
  { value: "casual", label: "Casual Labour", icon: "users", color: "#3B82F6" },
  { value: "contractor", label: "Contractor", icon: "briefcase", color: "#F59E0B" },
  { value: "other", label: "Other", icon: "more-horizontal", color: "#6B7280" },
];

const QUICK_AMOUNTS = [500, 1000, 2000, 3000, 5000, 10000, 15000, 20000];

function fmtKsh(n: number) {
  if (n >= 1_000) return `KSh ${(n / 1_000).toFixed(0)}K`;
  return `KSh ${n}`;
}

export default function NewPaymentScreen() {
  const { addPayment, project } = useApp();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [payType, setPayType] = useState<PayType>("fundi");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!recipient.trim()) {
      Alert.alert("Recipient required", "Who are you paying?");
      return;
    }
    const amt = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Amount required", "Please enter a payment amount.");
      return;
    }
    setSaving(true);
    try {
      await addPayment({
        date: new Date().toISOString(),
        amount: amt,
        recipient: recipient.trim(),
        type: payType,
        description: description.trim() || undefined,
        stage: project?.stage ?? "Foundation",
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 14, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[s.title, { color: colors.foreground }]}>Log Payment</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>Labour & contractor payments</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Payment type */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>PAYMENT TYPE</Text>
          <View style={s.typeGrid}>
            {TYPES.map((t) => {
              const isSelected = payType === t.value;
              return (
                <TouchableOpacity key={t.value}
                  style={[s.typeCard, { backgroundColor: isSelected ? t.color + "18" : colors.card, borderColor: isSelected ? t.color : colors.border, borderWidth: isSelected ? 2 : 1 }]}
                  onPress={() => setPayType(t.value)}>
                  <Feather name={t.icon as any} size={20} color={isSelected ? t.color : colors.mutedForeground} />
                  <Text style={[s.typeLabel, { color: isSelected ? t.color : colors.foreground }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Recipient */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>RECIPIENT NAME</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. Kamau Njoroge, Apex Contractors Ltd..."
            placeholderTextColor={colors.mutedForeground}
            value={recipient} onChangeText={setRecipient} autoFocus />
        </View>

        {/* Amount */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>AMOUNT (KSh)</Text>
          <TextInput
            style={[s.bigInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="0" placeholderTextColor={colors.mutedForeground}
            value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          <View style={s.quickRow}>
            {QUICK_AMOUNTS.map((n) => (
              <TouchableOpacity key={n}
                style={[s.quickBtn, { backgroundColor: amount === n.toString() ? colors.primary : colors.card, borderColor: amount === n.toString() ? colors.primary : colors.border }]}
                onPress={() => setAmount(n.toString())}>
                <Text style={[s.quickBtnText, { color: amount === n.toString() ? colors.primaryForeground : colors.foreground }]}>{fmtKsh(n)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>DESCRIPTION — optional</Text>
          <TextInput
            style={[s.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. Day rate for 3 days, foundation work. Week 2 payment..."
            placeholderTextColor={colors.mutedForeground}
            value={description} onChangeText={setDescription} multiline numberOfLines={3} textAlignVertical="top" />
        </View>

        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: "#22C55E", opacity: saving ? 0.75 : 1 }]}
          onPress={handleSave} disabled={saving} activeOpacity={0.8}>
          <Feather name="dollar-sign" size={18} color="#fff" />
          <Text style={s.saveBtnText}>{saving ? "Saving…" : "Record Payment"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  closeBtn: { padding: 6 },
  title: { fontSize: 17, fontFamily: "Manrope_700Bold", textAlign: "center" },
  subtitle: { fontSize: 12, fontFamily: "Manrope_400Regular", textAlign: "center" },
  content: { padding: 20, gap: 0 },
  field: { marginBottom: 24, gap: 8 },
  label: { fontSize: 11, fontFamily: "Manrope_700Bold", letterSpacing: 0.8 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeCard: { width: "47%", borderRadius: 14, padding: 14, alignItems: "center", gap: 8 },
  typeLabel: { fontSize: 13, fontFamily: "Manrope_700Bold", textAlign: "center" },
  input: { height: 52, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, fontFamily: "Manrope_500Medium" },
  bigInput: { height: 68, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 18, fontSize: 28, fontFamily: "Manrope_800ExtraBold" },
  textArea: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: "Manrope_400Regular", minHeight: 90 },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  quickBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  quickBtnText: { fontSize: 13, fontFamily: "Manrope_600SemiBold" },
  saveBtn: { height: 58, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  saveBtnText: { color: "#fff", fontSize: 17, fontFamily: "Manrope_700Bold" },
});
