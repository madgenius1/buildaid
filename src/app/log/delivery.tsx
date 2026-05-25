import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { QuickAmounts } from "@/components/QuickAmounts";
import { PhotoCapture } from "@/components/PhotoCapture";

export default function LogDeliveryScreen() {
  const { materials, logDelivery } = useApp();
  const [selectedId, setSelectedId] = useState(materials[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Timestamp captured when user opens screen — the moment of logging
  const [captureTime] = useState(new Date().toISOString());

  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const selectedMat = materials.find((m) => m.id === selectedId);
  const undelivered = selectedMat
    ? selectedMat.purchased - selectedMat.delivered
    : 0;

  const handleFillAll = () => {
    if (undelivered > 0) setQuantity(undelivered.toString());
  };

  const handleSave = async () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Missing quantity", "Please enter or tap a quantity.");
      return;
    }
    setIsSaving(true);
    try {
      await logDelivery(selectedId, qty, {
        cost: cost ? parseFloat(cost.replace(/,/g, "")) : undefined,
        notes: notes.trim() || undefined,
        photoUri: photoUri ?? undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString("en-KE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          s.header,
          {
            paddingTop: insets.top + 14,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[s.title, { color: colors.foreground }]}>
            Log Delivery
          </Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
            {fmtTime(captureTime)}
          </Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 56 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Material selector */}
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>
            MATERIAL
          </Text>
          <View style={s.chipRow}>
            {materials.map((m) => {
              const outstanding = m.purchased - m.delivered;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    s.chip,
                    {
                      backgroundColor:
                        selectedId === m.id ? colors.primary : colors.card,
                      borderColor:
                        selectedId === m.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedId(m.id)}
                >
                  <Text
                    style={[
                      s.chipText,
                      {
                        color:
                          selectedId === m.id
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {m.name}
                  </Text>
                  {outstanding > 0 ? (
                    <View
                      style={[
                        s.badge,
                        {
                          backgroundColor:
                            selectedId === m.id
                              ? "rgba(255,255,255,0.25)"
                              : colors.warning + "25",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.badgeText,
                          {
                            color:
                              selectedId === m.id ? "#fff" : colors.warning,
                          },
                        ]}
                      >
                        {outstanding} due
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quantity */}
        <View style={s.fieldGroup}>
          <View style={s.labelRow}>
            <Text style={[s.label, { color: colors.mutedForeground }]}>
              QUANTITY {selectedMat ? `(${selectedMat.unit})` : ""}
            </Text>
            {undelivered > 0 ? (
              <TouchableOpacity onPress={handleFillAll}>
                <Text style={[s.fillAll, { color: colors.primary }]}>
                  Fill all ({undelivered})
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {selectedMat && selectedMat.purchased > 0 ? (
            <Text style={[s.hint, { color: colors.mutedForeground }]}>
              Purchased: {selectedMat.purchased} · Delivered so far:{" "}
              {selectedMat.delivered}
            </Text>
          ) : null}
          <TextInput
            style={[
              s.bigInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            autoFocus
          />
          {selectedMat ? (
            <QuickAmounts
              unit={selectedMat.unit}
              current={quantity}
              onSelect={setQuantity}
            />
          ) : null}
        </View>

        {/* Receipt Photo */}
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>
            RECEIPT / DELIVERY PHOTO
          </Text>
          <PhotoCapture
            photoUri={photoUri}
            timestamp={captureTime}
            label="Capture Delivery Receipt"
            onCapture={setPhotoUri}
            onRemove={() => setPhotoUri(null)}
          />
        </View>

        {/* Delivery cost (transport fee) */}
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>
            TRANSPORT / DELIVERY FEE (KSh) — optional
          </Text>
          <TextInput
            style={[
              s.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            value={cost}
            onChangeText={setCost}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Notes */}
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>
            NOTES — optional
          </Text>
          <TextInput
            style={[
              s.notesInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="e.g. Delivered by Kamau transport, truck KBX 123G"
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Correlation summary */}
        {quantity && selectedMat ? (
          <View
            style={[
              s.summaryCard,
              { backgroundColor: colors.primary + "0E", borderColor: colors.primary + "30" },
            ]}
          >
            <Feather name="link" size={13} color={colors.primary} />
            <Text style={[s.summaryText, { color: colors.foreground }]}>
              This delivery of{" "}
              <Text style={{ fontFamily: "Manrope_700Bold" }}>
                {quantity} {selectedMat.unit}
              </Text>{" "}
              of {selectedMat.name} will be correlated with your purchase
              record and stamped at{" "}
              <Text style={{ fontFamily: "Manrope_700Bold" }}>
                {fmtTime(captureTime)}
              </Text>
              {photoUri ? " with photo evidence" : ""}.
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            s.saveBtn,
            {
              backgroundColor: "#8B5CF6",
              opacity: isSaving ? 0.75 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Feather name="truck" size={18} color="#fff" />
          <Text style={s.saveBtnText}>
            {isSaving ? "Saving…" : "Save Delivery"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  closeBtn: { padding: 6 },
  title: { fontSize: 17, fontFamily: "Manrope_700Bold", textAlign: "center" },
  subtitle: {
    fontSize: 12,
    fontFamily: "Manrope_400Regular",
    textAlign: "center",
  },
  content: { padding: 20, gap: 0 },
  fieldGroup: { marginBottom: 24, gap: 8 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontSize: 11, fontFamily: "Manrope_700Bold", letterSpacing: 0.8 },
  fillAll: { fontSize: 13, fontFamily: "Manrope_600SemiBold" },
  hint: { fontSize: 12, fontFamily: "Manrope_400Regular" },
  bigInput: {
    height: 60,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 24,
    fontFamily: "Manrope_700Bold",
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: "Manrope_600SemiBold",
  },
  notesInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Manrope_400Regular",
    minHeight: 90,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontFamily: "Manrope_600SemiBold" },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 11, fontFamily: "Manrope_600SemiBold" },
  summaryCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
    lineHeight: 19,
  },
  saveBtn: {
    height: 58,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 17, fontFamily: "Manrope_700Bold" },
});
