import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, Material } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { PhotoCapture } from "@/components/PhotoCapture";

const UNIT_OPTIONS = ["bags", "kg", "m³", "m²", "litres", "tonnes", "pieces", "rolls"];

interface EditForm {
  name: string;
  unit: string;
  photoUri: string | null;
}

function MaterialFormModal({
  visible,
  initial,
  title,
  onSave,
  onClose,
  colors,
}: {
  visible: boolean;
  initial: EditForm;
  title: string;
  onSave: (form: EditForm) => Promise<void>;
  onClose: () => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  const [form, setForm] = useState<EditForm>(initial);
  const [saving, setSaving] = useState(false);
  const [timestamp] = useState(new Date().toISOString());
  const insets = useSafeAreaInsets();

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("Name required", "Please enter a material name.");
      return;
    }
    if (!form.unit.trim()) {
      Alert.alert("Unit required", "Please enter a unit of measure.");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[mf.root, { backgroundColor: colors.background }]}>
        <View
          style={[
            mf.header,
            {
              paddingTop: insets.top + 14,
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={mf.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[mf.title, { color: colors.foreground }]}>{title}</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView
          contentContainerStyle={[mf.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Material name */}
          <View style={mf.fieldGroup}>
            <Text style={[mf.label, { color: colors.mutedForeground }]}>
              MATERIAL NAME
            </Text>
            <TextInput
              style={[
                mf.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="e.g. Timber, Roofing Sheets, Bricks..."
              placeholderTextColor={colors.mutedForeground}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              autoFocus
            />
          </View>

          {/* Unit */}
          <View style={mf.fieldGroup}>
            <Text style={[mf.label, { color: colors.mutedForeground }]}>
              UNIT OF MEASURE
            </Text>
            <TextInput
              style={[
                mf.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="e.g. pieces, m², rolls..."
              placeholderTextColor={colors.mutedForeground}
              value={form.unit}
              onChangeText={(v) => setForm((f) => ({ ...f, unit: v }))}
            />
            <View style={mf.chipRow}>
              {UNIT_OPTIONS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    mf.chip,
                    {
                      backgroundColor:
                        form.unit === u ? colors.primary : colors.secondary,
                      borderColor:
                        form.unit === u ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setForm((f) => ({ ...f, unit: u }))}
                >
                  <Text
                    style={[
                      mf.chipText,
                      {
                        color:
                          form.unit === u
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reference photo */}
          <View style={mf.fieldGroup}>
            <Text style={[mf.label, { color: colors.mutedForeground }]}>
              REFERENCE PHOTO — optional
            </Text>
            <Text style={[mf.hint, { color: colors.mutedForeground }]}>
              Photograph the material to help identify it on site
            </Text>
            <PhotoCapture
              photoUri={form.photoUri}
              timestamp={timestamp}
              label="Photograph Material"
              onCapture={(uri) => setForm((f) => ({ ...f, photoUri: uri }))}
              onRemove={() => setForm((f) => ({ ...f, photoUri: null }))}
            />
          </View>

          <TouchableOpacity
            style={[
              mf.saveBtn,
              { backgroundColor: colors.primary, opacity: saving ? 0.75 : 1 },
            ]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={mf.saveBtnText}>
              {saving ? "Saving…" : "Save Material"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function MaterialsManageScreen() {
  const { materials, addMaterial, updateMaterial, deleteMaterial, getMaterialTransactions } = useApp();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [showAdd, setShowAdd] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const handleDelete = (mat: Material) => {
    const hasTxs = getMaterialTransactions(mat.id).length > 0;
    if (hasTxs) {
      Alert.alert(
        "Cannot Delete",
        `"${mat.name}" has transaction records. You can rename it but not delete it while records exist.`,
        [{ text: "OK" }]
      );
      return;
    }
    Alert.alert(
      "Delete Material",
      `Delete "${mat.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const ok = await deleteMaterial(mat.id);
            if (!ok) {
              Alert.alert("Cannot delete", "This material has transaction history.");
            } else {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
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
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[s.title, { color: colors.foreground }]}>
            Manage Materials
          </Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
            {materials.length} material{materials.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAdd(true)}
        >
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 32 }]}
      >
        <View
          style={[s.infoCard, { backgroundColor: colors.primary + "0F", borderColor: colors.primary + "30" }]}
        >
          <Feather name="info" size={14} color={colors.primary} />
          <Text style={[s.infoText, { color: colors.foreground }]}>
            Add custom materials or photograph existing ones for easy identification on site.
          </Text>
        </View>

        {materials.map((mat) => {
          const txCount = getMaterialTransactions(mat.id).length;
          const hasTxs = txCount > 0;
          return (
            <View
              key={mat.id}
              style={[
                s.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={s.cardLeft}>
                {mat.photoUri ? (
                  <TouchableOpacity
                    onPress={() => setEditingMaterial(mat)}
                    style={s.photoThumb}
                  >
                    <Image
                      source={{ uri: mat.photoUri }}
                      style={s.thumbImg}
                      resizeMode="cover"
                    />
                    <View style={[s.photoOverlay, { backgroundColor: "rgba(0,0,0,0.3)" }]}>
                      <Feather name="camera" size={10} color="#fff" />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={[s.matIcon, { backgroundColor: colors.secondary }]}
                  >
                    <Feather name="layers" size={18} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={s.matInfo}>
                  <View style={s.matNameRow}>
                    <Text style={[s.matName, { color: colors.foreground }]}>
                      {mat.name}
                    </Text>
                    {mat.isCustom ? (
                      <View
                        style={[
                          s.customBadge,
                          { backgroundColor: colors.primary + "15" },
                        ]}
                      >
                        <Text style={[s.customBadgeText, { color: colors.primary }]}>
                          Custom
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[s.matUnit, { color: colors.mutedForeground }]}>
                    Measured in {mat.unit}
                    {hasTxs ? ` · ${txCount} transaction${txCount !== 1 ? "s" : ""}` : " · No records yet"}
                  </Text>
                </View>
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity
                  onPress={() => setEditingMaterial(mat)}
                  style={[s.actionBtn, { backgroundColor: colors.secondary }]}
                >
                  <Feather name="edit-2" size={15} color={colors.foreground} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(mat)}
                  style={[
                    s.actionBtn,
                    {
                      backgroundColor: hasTxs
                        ? colors.secondary
                        : colors.destructive + "15",
                    },
                  ]}
                >
                  <Feather
                    name="trash-2"
                    size={15}
                    color={hasTxs ? colors.mutedForeground : colors.destructive}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Add modal */}
      <MaterialFormModal
        visible={showAdd}
        initial={{ name: "", unit: "", photoUri: null }}
        title="Add Material"
        onSave={async (form) => {
          await addMaterial({
            name: form.name,
            unit: form.unit,
            photoUri: form.photoUri ?? undefined,
          });
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        onClose={() => setShowAdd(false)}
        colors={colors}
      />

      {/* Edit modal */}
      {editingMaterial ? (
        <MaterialFormModal
          visible={true}
          initial={{
            name: editingMaterial.name,
            unit: editingMaterial.unit,
            photoUri: editingMaterial.photoUri ?? null,
          }}
          title="Edit Material"
          onSave={async (form) => {
            await updateMaterial(editingMaterial.id, {
              name: form.name,
              unit: form.unit,
              photoUri: form.photoUri ?? undefined,
            });
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setEditingMaterial(null);
          }}
          onClose={() => setEditingMaterial(null)}
          colors={colors}
        />
      ) : null}
    </View>
  );
}

const mf = StyleSheet.create({
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
  content: { padding: 20, gap: 0 },
  fieldGroup: { marginBottom: 24, gap: 8 },
  label: { fontSize: 11, fontFamily: "Manrope_700Bold", letterSpacing: 0.8 },
  hint: { fontSize: 12, fontFamily: "Manrope_400Regular" },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Manrope_500Medium",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontFamily: "Manrope_600SemiBold" },
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
  backBtn: { padding: 6 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 17, fontFamily: "Manrope_700Bold", textAlign: "center" },
  subtitle: { fontSize: 12, fontFamily: "Manrope_400Regular", textAlign: "center" },
  list: { padding: 16, gap: 10 },
  infoCard: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 4,
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Manrope_400Regular", lineHeight: 19 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  photoThumb: { width: 46, height: 46, borderRadius: 12, overflow: "hidden", position: "relative" },
  thumbImg: { width: "100%", height: "100%" },
  photoOverlay: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  matIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  matInfo: { flex: 1 },
  matNameRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 3 },
  matName: { fontSize: 15, fontFamily: "Manrope_700Bold" },
  customBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  customBadgeText: { fontSize: 11, fontFamily: "Manrope_600SemiBold" },
  matUnit: { fontSize: 12, fontFamily: "Manrope_400Regular" },
  cardActions: { flexDirection: "row", gap: 6 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
});
