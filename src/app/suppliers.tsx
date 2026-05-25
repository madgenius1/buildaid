import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  TextInput, Modal, Linking, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, Supplier } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["Cement", "Steel", "Sand & Ballast", "Timber", "Plumbing", "Electrical", "Hardware", "General"];

interface SupplierForm {
  name: string;
  phone: string;
  category: string;
  notes: string;
}

const EMPTY_FORM: SupplierForm = { name: "", phone: "", category: "General", notes: "" };

function SupplierFormModal({
  visible, initial, title, onSave, onClose, colors,
}: {
  visible: boolean;
  initial: SupplierForm;
  title: string;
  onSave: (form: SupplierForm) => Promise<void>;
  onClose: () => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  const [form, setForm] = useState<SupplierForm>(initial);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert("Name required", "Please enter the supplier name."); return; }
    if (!form.phone.trim()) { Alert.alert("Phone required", "Please enter a phone number."); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[sf.root, { backgroundColor: colors.background }]}>
        <View style={[sf.header, { paddingTop: insets.top + 14, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={sf.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[sf.title, { color: colors.foreground }]}>{title}</Text>
          <View style={{ width: 34 }} />
        </View>
        <ScrollView contentContainerStyle={[sf.content, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
          <View style={sf.field}>
            <Text style={[sf.label, { color: colors.mutedForeground }]}>SUPPLIER NAME</Text>
            <TextInput style={[sf.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Bamburi Cement Ltd" placeholderTextColor={colors.mutedForeground}
              value={form.name} onChangeText={(v) => setForm(f => ({ ...f, name: v }))} autoFocus />
          </View>
          <View style={sf.field}>
            <Text style={[sf.label, { color: colors.mutedForeground }]}>PHONE NUMBER</Text>
            <TextInput style={[sf.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="+254 7XX XXX XXX" placeholderTextColor={colors.mutedForeground}
              value={form.phone} onChangeText={(v) => setForm(f => ({ ...f, phone: v }))} keyboardType="phone-pad" />
          </View>
          <View style={sf.field}>
            <Text style={[sf.label, { color: colors.mutedForeground }]}>CATEGORY</Text>
            <View style={sf.chipRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat}
                  style={[sf.chip, { backgroundColor: form.category === cat ? colors.primary : colors.card, borderColor: form.category === cat ? colors.primary : colors.border }]}
                  onPress={() => setForm(f => ({ ...f, category: cat }))}>
                  <Text style={[sf.chipText, { color: form.category === cat ? colors.primaryForeground : colors.foreground }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={sf.field}>
            <Text style={[sf.label, { color: colors.mutedForeground }]}>NOTES — optional</Text>
            <TextInput style={[sf.notesInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Payment terms, delivery areas, contact person..." placeholderTextColor={colors.mutedForeground}
              value={form.notes} onChangeText={(v) => setForm(f => ({ ...f, notes: v }))} multiline numberOfLines={3} textAlignVertical="top" />
          </View>
          <TouchableOpacity style={[sf.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.75 : 1 }]}
            onPress={handleSave} disabled={saving} activeOpacity={0.8}>
            <Feather name="check" size={18} color="#fff" />
            <Text style={sf.saveBtnText}>{saving ? "Saving…" : "Save Supplier"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function SuppliersScreen() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, getSupplierTransactions } = useApp();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const handleCall = (phone: string) => {
    const url = `tel:${phone.replace(/\s/g, "")}`;
    if (Platform.OS === "web") {
      Alert.alert("Call Supplier", `Phone: ${phone}`);
    } else {
      Linking.openURL(url).catch(() => Alert.alert("Cannot call", "Unable to open dialler."));
    }
  };

  const handleDelete = (s: Supplier) => {
    Alert.alert("Delete Supplier", `Remove "${s.name}" from your directory?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteSupplier(s.id) },
    ]);
  };

  return (
    <View style={[sc.root, { backgroundColor: colors.background }]}>
      <View style={[sc.header, { paddingTop: insets.top + 14, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={sc.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[sc.title, { color: colors.foreground }]}>Suppliers</Text>
          <Text style={[sc.subtitle, { color: colors.mutedForeground }]}>{suppliers.length} contacts</Text>
        </View>
        <TouchableOpacity style={[sc.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAdd(true)}>
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[sc.list, { paddingBottom: insets.bottom + 32 }]}>
        {suppliers.length === 0 ? (
          <View style={sc.empty}>
            <View style={[sc.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="book" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[sc.emptyTitle, { color: colors.foreground }]}>No suppliers yet</Text>
            <Text style={[sc.emptyBody, { color: colors.mutedForeground }]}>
              Add your cement suppliers, hardware shops, and transporters. They'll appear when logging purchases.
            </Text>
            <TouchableOpacity style={[sc.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAdd(true)}>
              <Feather name="plus" size={16} color="#fff" />
              <Text style={sc.emptyBtnText}>Add First Supplier</Text>
            </TouchableOpacity>
          </View>
        ) : (
          suppliers.map((s) => {
            const txCount = getSupplierTransactions(s.id).length;
            const totalSpent = getSupplierTransactions(s.id).reduce((sum, t) => sum + (t.cost ?? 0), 0);
            return (
              <View key={s.id} style={[sc.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={sc.cardTop}>
                  <View style={[sc.avatar, { backgroundColor: colors.primary + "18" }]}>
                    <Text style={[sc.avatarText, { color: colors.primary }]}>
                      {s.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={sc.cardInfo}>
                    <Text style={[sc.supplierName, { color: colors.foreground }]}>{s.name}</Text>
                    <View style={[sc.catBadge, { backgroundColor: colors.secondary }]}>
                      <Text style={[sc.catText, { color: colors.mutedForeground }]}>{s.category}</Text>
                    </View>
                  </View>
                </View>
                <View style={[sc.divider, { backgroundColor: colors.border }]} />
                <View style={sc.cardStats}>
                  <View style={sc.statItem}>
                    <Text style={[sc.statValue, { color: colors.foreground }]}>{txCount}</Text>
                    <Text style={[sc.statLabel, { color: colors.mutedForeground }]}>Purchases</Text>
                  </View>
                  {totalSpent > 0 ? (
                    <View style={sc.statItem}>
                      <Text style={[sc.statValue, { color: colors.foreground }]}>
                        {totalSpent >= 1_000_000 ? `KSh ${(totalSpent/1_000_000).toFixed(1)}M` : `KSh ${(totalSpent/1_000).toFixed(0)}K`}
                      </Text>
                      <Text style={[sc.statLabel, { color: colors.mutedForeground }]}>Total paid</Text>
                    </View>
                  ) : null}
                </View>
                {s.notes ? (
                  <Text style={[sc.notes, { color: colors.mutedForeground }]} numberOfLines={2}>{s.notes}</Text>
                ) : null}
                <View style={sc.cardActions}>
                  <TouchableOpacity style={[sc.callBtn, { backgroundColor: "#22C55E18" }]} onPress={() => handleCall(s.phone)}>
                    <Feather name="phone" size={15} color="#22C55E" />
                    <Text style={[sc.callBtnText, { color: "#22C55E" }]}>{s.phone}</Text>
                  </TouchableOpacity>
                  <View style={sc.actionBtns}>
                    <TouchableOpacity style={[sc.iconBtn, { backgroundColor: colors.secondary }]} onPress={() => setEditing(s)}>
                      <Feather name="edit-2" size={14} color={colors.foreground} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[sc.iconBtn, { backgroundColor: colors.destructive + "15" }]} onPress={() => handleDelete(s)}>
                      <Feather name="trash-2" size={14} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <SupplierFormModal visible={showAdd} initial={EMPTY_FORM} title="Add Supplier"
        onSave={async (f) => { await addSupplier({ name: f.name, phone: f.phone, category: f.category, notes: f.notes || undefined }); await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
        onClose={() => setShowAdd(false)} colors={colors} />

      {editing ? (
        <SupplierFormModal visible={true}
          initial={{ name: editing.name, phone: editing.phone, category: editing.category, notes: editing.notes ?? "" }}
          title="Edit Supplier"
          onSave={async (f) => { await updateSupplier(editing.id, { name: f.name, phone: f.phone, category: f.category, notes: f.notes || undefined }); setEditing(null); }}
          onClose={() => setEditing(null)} colors={colors} />
      ) : null}
    </View>
  );
}

const sf = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  closeBtn: { padding: 6 },
  title: { fontSize: 17, fontFamily: "Manrope_700Bold", textAlign: "center" },
  content: { padding: 20, gap: 0 },
  field: { marginBottom: 22, gap: 8 },
  label: { fontSize: 11, fontFamily: "Manrope_700Bold", letterSpacing: 0.8 },
  input: { height: 52, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, fontFamily: "Manrope_500Medium" },
  notesInput: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: "Manrope_400Regular", minHeight: 90 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontFamily: "Manrope_600SemiBold" },
  saveBtn: { height: 58, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  saveBtnText: { color: "#fff", fontSize: 17, fontFamily: "Manrope_700Bold" },
});

const sc = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6 },
  addBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 17, fontFamily: "Manrope_700Bold", textAlign: "center" },
  subtitle: { fontSize: 12, fontFamily: "Manrope_400Regular", textAlign: "center" },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: "center", gap: 14, paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Manrope_700Bold" },
  emptyBody: { fontSize: 14, fontFamily: "Manrope_400Regular", textAlign: "center", lineHeight: 21, color: "#666" },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Manrope_700Bold" },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 20, fontFamily: "Manrope_800ExtraBold" },
  cardInfo: { gap: 4 },
  supplierName: { fontSize: 16, fontFamily: "Manrope_700Bold" },
  catBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  catText: { fontSize: 12, fontFamily: "Manrope_500Medium" },
  divider: { height: 1 },
  cardStats: { flexDirection: "row", gap: 24 },
  statItem: { gap: 2 },
  statValue: { fontSize: 16, fontFamily: "Manrope_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Manrope_400Regular" },
  notes: { fontSize: 13, fontFamily: "Manrope_400Regular", lineHeight: 19 },
  cardActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  callBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flex: 1, marginRight: 8 },
  callBtnText: { fontSize: 14, fontFamily: "Manrope_600SemiBold" },
  actionBtns: { flexDirection: "row", gap: 6 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
});
