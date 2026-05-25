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
import { getBaseline } from "@/utils/baseline";

export default function LogUsageScreen() {
  const { materials, logUsage, project } = useApp();
  const [selectedId, setSelectedId] = useState(materials[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const selectedMat = materials.find((m) => m.id === selectedId);
  const remaining = selectedMat
    ? selectedMat.purchased - selectedMat.used
    : 0;

  const baseline =
    selectedMat && project ? getBaseline(selectedMat.name, project.stage) : null;
  const expectedTotal =
    baseline && project ? baseline.max * project.area : null;

  const handleSave = async () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Missing quantity", "Please enter or tap a quantity.");
      return;
    }
    setIsSaving(true);
    try {
      await logUsage(selectedId, qty, notes.trim() || undefined);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
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
          <Text style={[s.title, { color: colors.foreground }]}>Log Usage</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
            Record materials used today
          </Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 56 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>MATERIAL</Text>
          <View style={s.chipRow}>
            {materials.map((m) => {
              const rem = m.purchased - m.used;
              const isLow = m.purchased > 0 && rem / m.purchased < 0.2;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    s.chip,
                    {
                      backgroundColor:
                        selectedId === m.id ? colors.primary : colors.card,
                      borderColor:
                        selectedId === m.id
                          ? colors.primary
                          : isLow
                          ? colors.destructive + "60"
                          : colors.border,
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
                  {isLow && selectedId !== m.id ? (
                    <Feather name="alert-circle" size={12} color={colors.destructive} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedMat && selectedMat.purchased > 0 ? (
          <View
            style={[
              s.stockCard,
              {
                backgroundColor:
                  remaining <= 0
                    ? colors.destructive + "10"
                    : remaining / selectedMat.purchased < 0.2
                    ? colors.warning + "10"
                    : colors.success + "10",
                borderColor:
                  remaining <= 0
                    ? colors.destructive + "40"
                    : remaining / selectedMat.purchased < 0.2
                    ? colors.warning + "40"
                    : colors.success + "40",
              },
            ]}
          >
            <View style={s.stockRow}>
              <Text style={[s.stockLabel, { color: colors.mutedForeground }]}>
                Remaining stock
              </Text>
              <Text
                style={[
                  s.stockValue,
                  {
                    color:
                      remaining <= 0
                        ? colors.destructive
                        : remaining / selectedMat.purchased < 0.2
                        ? colors.warning
                        : colors.success,
                  },
                ]}
              >
                {remaining} {selectedMat.unit}
              </Text>
            </View>
            {expectedTotal != null ? (
              <View style={s.stockRow}>
                <Text style={[s.stockLabel, { color: colors.mutedForeground }]}>
                  Expected max for {project?.stage}
                </Text>
                <Text style={[s.stockHint, { color: colors.mutedForeground }]}>
                  {expectedTotal.toFixed(0)} {selectedMat.unit}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>
            QUANTITY USED {selectedMat ? `(${selectedMat.unit})` : ""}
          </Text>
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
            <QuickAmounts unit={selectedMat.unit} current={quantity} onSelect={setQuantity} />
          ) : null}
        </View>

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
            placeholder="e.g. Foundation slab pour, east wing columns..."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[
            s.saveBtn,
            { backgroundColor: colors.warning, opacity: isSaving ? 0.75 : 1 },
          ]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Feather name="tool" size={18} color="#fff" />
          <Text style={s.saveBtnText}>
            {isSaving ? "Saving…" : "Save Usage"}
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
  subtitle: { fontSize: 12, fontFamily: "Manrope_400Regular", textAlign: "center" },
  content: { padding: 20, gap: 0 },
  fieldGroup: { marginBottom: 24, gap: 8 },
  label: { fontSize: 11, fontFamily: "Manrope_700Bold", letterSpacing: 0.8 },
  bigInput: {
    height: 60,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 24,
    fontFamily: "Manrope_700Bold",
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
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontFamily: "Manrope_600SemiBold" },
  stockCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 24,
    gap: 6,
  },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stockLabel: { fontSize: 13, fontFamily: "Manrope_400Regular" },
  stockValue: { fontSize: 16, fontFamily: "Manrope_700Bold" },
  stockHint: { fontSize: 13, fontFamily: "Manrope_400Regular" },
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
