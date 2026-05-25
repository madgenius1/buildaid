import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, Supplier } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { QuickAmounts } from "@/components/QuickAmounts";

function SupplierPicker({
  visible,
  suppliers,
  selected,
  onSelect,
  onAddNew,
  onClose,
  colors,
}: {
  visible: boolean;
  suppliers: Supplier[];
  selected: string | null;
  onSelect: (s: Supplier) => void;
  onAddNew: () => void;
  onClose: () => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[sp.root, { backgroundColor: colors.background }]}>
        <View style={[sp.header, { paddingTop: insets.top + 14, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={sp.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[sp.title, { color: colors.foreground }]}>Pick Supplier</Text>
          <View style={{ width: 34 }} />
        </View>
        <FlatList
          data={suppliers}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, paddingTop: 12 }}
          ListHeaderComponent={
            <TouchableOpacity style={[sp.addNewBtn, { borderColor: colors.primary, backgroundColor: colors.primary + "0F" }]} onPress={onAddNew}>
              <Feather name="plus-circle" size={18} color={colors.primary} />
              <Text style={[sp.addNewText, { color: colors.primary }]}>Add New Supplier</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={sp.empty}>
              <Text style={[sp.emptyText, { color: colors.mutedForeground }]}>No suppliers saved yet.</Text>
              <Text style={[sp.emptyText, { color: colors.mutedForeground }]}>Tap above to add one.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selected === item.id;
            return (
              <TouchableOpacity
                style={[sp.row, { backgroundColor: isSelected ? colors.primary + "12" : colors.card, borderColor: isSelected ? colors.primary : colors.border, borderWidth: isSelected ? 2 : 1 }]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <View style={[sp.avatar, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[sp.avatarText, { color: colors.primary }]}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={sp.rowInfo}>
                  <Text style={[sp.rowName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[sp.rowMeta, { color: colors.mutedForeground }]}>{item.category} · {item.phone}</Text>
                </View>
                {isSelected ? <Feather name="check-circle" size={18} color={colors.primary} /> : null}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      </View>
    </Modal>
  );
}

export default function LogPurchaseScreen() {
  const { materials, logPurchase, suppliers } = useApp();
  const [selectedId, setSelectedId] = useState(materials[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const selectedMat = materials.find((m) => m.id === selectedId);
  const selectedSupplier = supplierId ? suppliers.find((s) => s.id === supplierId) : null;

  const handleSave = async () => {
    const qty = parseFloat(quantity);
    const costNum = parseFloat(cost.replace(/,/g, ""));
    if (isNaN(qty) || qty <= 0) { Alert.alert("Missing quantity", "Please enter a quantity."); return; }
    if (isNaN(costNum) || costNum <= 0) { Alert.alert("Missing cost", "Please enter the total cost."); return; }
    setIsSaving(true);
    try {
      await logPurchase(selectedId, qty, costNum, notes.trim() || undefined, supplierId ?? undefined);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 14, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[s.title, { color: colors.foreground }]}>Log Purchase</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>Record materials bought</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 56 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Material */}
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>MATERIAL</Text>
          <View style={s.chipRow}>
            {materials.map((m) => (
              <TouchableOpacity key={m.id}
                style={[s.chip, { backgroundColor: selectedId === m.id ? colors.primary : colors.card, borderColor: selectedId === m.id ? colors.primary : colors.border }]}
                onPress={() => setSelectedId(m.id)}>
                <Text style={[s.chipText, { color: selectedId === m.id ? colors.primaryForeground : colors.foreground }]}>{m.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Supplier */}
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>SUPPLIER — optional</Text>
          <TouchableOpacity
            style={[s.supplierBtn, { backgroundColor: colors.card, borderColor: selectedSupplier ? colors.primary : colors.border, borderWidth: selectedSupplier ? 2 : 1 }]}
            onPress={() => setShowSupplierPicker(true)}
          >
            {selectedSupplier ? (
              <>
                <View style={[s.supplierAvatar, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[s.supplierAvatarText, { color: colors.primary }]}>{selectedSupplier.name.charAt(0)}</Text>
                </View>
                <View style={s.supplierInfo}>
                  <Text style={[s.supplierName, { color: colors.foreground }]}>{selectedSupplier.name}</Text>
                  <Text style={[s.supplierMeta, { color: colors.mutedForeground }]}>{selectedSupplier.category} · {selectedSupplier.phone}</Text>
                </View>
                <TouchableOpacity onPress={() => setSupplierId(null)} style={s.clearBtn}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[s.supplierIconBox, { backgroundColor: colors.secondary }]}>
                  <Feather name="book" size={18} color={colors.mutedForeground} />
                </View>
                <Text style={[s.supplierPlaceholder, { color: colors.mutedForeground }]}>
                  {suppliers.length > 0 ? "Pick a supplier from your directory" : "Add suppliers in the Suppliers section"}
                </Text>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Quantity */}
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>QUANTITY {selectedMat ? `(${selectedMat.unit})` : ""}</Text>
          {selectedMat && selectedMat.purchased > 0 ? (
            <Text style={[s.hint, { color: colors.mutedForeground }]}>Currently purchased: {selectedMat.purchased} {selectedMat.unit}</Text>
          ) : null}
          <TextInput
            style={[s.bigInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="0" placeholderTextColor={colors.mutedForeground}
            value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" autoFocus />
          {selectedMat ? <QuickAmounts unit={selectedMat.unit} current={quantity} onSelect={setQuantity} /> : null}
        </View>

        {/* Cost */}
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>TOTAL COST (KSh)</Text>
          <TextInput
            style={[s.bigInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="0" placeholderTextColor={colors.mutedForeground}
            value={cost} onChangeText={setCost} keyboardType="decimal-pad" />
          {quantity && cost && parseFloat(quantity) > 0 && parseFloat(cost) > 0 && selectedMat ? (
            <View style={[s.unitCostBadge, { backgroundColor: colors.secondary }]}>
              <Feather name="tag" size={12} color={colors.mutedForeground} />
              <Text style={[s.unitCostText, { color: colors.mutedForeground }]}>
                KSh {(parseFloat(cost) / parseFloat(quantity)).toFixed(0)} per {selectedMat.unit}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Notes */}
        <View style={s.fieldGroup}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>NOTES — optional</Text>
          <TextInput
            style={[s.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Invoice number, delivery date, grade/spec..." placeholderTextColor={colors.mutedForeground}
            value={notes} onChangeText={setNotes} multiline numberOfLines={3} textAlignVertical="top" />
        </View>

        <TouchableOpacity style={[s.saveBtn, { backgroundColor: colors.primary, opacity: isSaving ? 0.75 : 1 }]}
          onPress={handleSave} disabled={isSaving} activeOpacity={0.8}>
          <Feather name="check" size={18} color="#fff" />
          <Text style={s.saveBtnText}>{isSaving ? "Saving…" : "Save Purchase"}</Text>
        </TouchableOpacity>
      </ScrollView>

      <SupplierPicker
        visible={showSupplierPicker}
        suppliers={suppliers}
        selected={supplierId}
        onSelect={(s) => setSupplierId(s.id)}
        onAddNew={() => { setShowSupplierPicker(false); router.push("/suppliers" as any); }}
        onClose={() => setShowSupplierPicker(false)}
        colors={colors}
      />
    </View>
  );
}

const sp = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  closeBtn: { padding: 6 },
  title: { fontSize: 17, fontFamily: "Manrope_700Bold", textAlign: "center" },
  addNewBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 12 },
  addNewText: { fontSize: 15, fontFamily: "Manrope_700Bold" },
  empty: { alignItems: "center", gap: 6, paddingTop: 32 },
  emptyText: { fontSize: 14, fontFamily: "Manrope_400Regular" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 12 },
  avatar: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontFamily: "Manrope_800ExtraBold" },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontFamily: "Manrope_700Bold", marginBottom: 2 },
  rowMeta: { fontSize: 12, fontFamily: "Manrope_400Regular" },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  closeBtn: { padding: 6 },
  title: { fontSize: 17, fontFamily: "Manrope_700Bold", textAlign: "center" },
  subtitle: { fontSize: 12, fontFamily: "Manrope_400Regular", textAlign: "center" },
  content: { padding: 20, gap: 0 },
  fieldGroup: { marginBottom: 24, gap: 8 },
  label: { fontSize: 11, fontFamily: "Manrope_700Bold", letterSpacing: 0.8 },
  hint: { fontSize: 12, fontFamily: "Manrope_400Regular" },
  bigInput: { height: 60, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 18, fontSize: 24, fontFamily: "Manrope_700Bold" },
  notesInput: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: "Manrope_400Regular", minHeight: 90 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  chipText: { fontSize: 14, fontFamily: "Manrope_600SemiBold" },
  supplierBtn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 12 },
  supplierIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  supplierPlaceholder: { flex: 1, fontSize: 14, fontFamily: "Manrope_400Regular" },
  supplierAvatar: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  supplierAvatarText: { fontSize: 18, fontFamily: "Manrope_800ExtraBold" },
  supplierInfo: { flex: 1 },
  supplierName: { fontSize: 14, fontFamily: "Manrope_700Bold" },
  supplierMeta: { fontSize: 12, fontFamily: "Manrope_400Regular", marginTop: 2 },
  clearBtn: { padding: 4 },
  unitCostBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  unitCostText: { fontSize: 12, fontFamily: "Manrope_500Medium" },
  saveBtn: { height: 58, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  saveBtnText: { color: "#fff", fontSize: 17, fontFamily: "Manrope_700Bold" },
});
