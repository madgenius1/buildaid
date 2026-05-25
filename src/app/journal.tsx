import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions,
  TextInput, Modal, Alert, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useApp, ProgressPhoto } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { PhotoViewer } from "@/components/PhotoViewer";

const { width: SCREEN_W } = Dimensions.get("window");
const THUMB_SIZE = (SCREEN_W - 48 - 8) / 2;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function AddPhotoModal({ visible, stage, onSave, onClose, colors }: {
  visible: boolean;
  stage: string;
  onSave: (uri: string, caption: string) => Promise<void>;
  onClose: () => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  const pickPhoto = async (fromCamera: boolean) => {
    if (Platform.OS !== "web" && fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") { Alert.alert("Camera access denied"); return; }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.85 });
      if (!res.canceled) setPhotoUri(res.assets[0].uri);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Photo library access denied"); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
      if (!res.canceled) setPhotoUri(res.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!photoUri) { Alert.alert("No photo", "Please capture or select a photo."); return; }
    setSaving(true);
    try { await onSave(photoUri, caption.trim()); onClose(); setPhotoUri(null); setCaption(""); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[am.root, { backgroundColor: colors.background }]}>
        <View style={[am.header, { paddingTop: insets.top + 14, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => { onClose(); setPhotoUri(null); setCaption(""); }} style={am.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[am.title, { color: colors.foreground }]}>Add Progress Photo</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView contentContainerStyle={[am.content, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
          {/* Photo area */}
          {photoUri ? (
            <TouchableOpacity onPress={() => setPhotoUri(null)} style={am.previewWrap}>
              <Image source={{ uri: photoUri }} style={am.preview} resizeMode="cover" />
              <View style={am.removeOverlay}>
                <Feather name="x" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={am.pickerRow}>
              {Platform.OS !== "web" ? (
                <TouchableOpacity style={[am.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => pickPhoto(true)}>
                  <Feather name="camera" size={24} color={colors.primary} />
                  <Text style={[am.pickerBtnText, { color: colors.foreground }]}>Take Photo</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={[am.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => pickPhoto(false)}>
                <Feather name="image" size={24} color={colors.primary} />
                <Text style={[am.pickerBtnText, { color: colors.foreground }]}>From Library</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={am.field}>
            <Text style={[am.label, { color: colors.mutedForeground }]}>CAPTION — optional</Text>
            <TextInput
              style={[am.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Foundation slab done, east wing ready for DPC..."
              placeholderTextColor={colors.mutedForeground}
              value={caption} onChangeText={setCaption} multiline numberOfLines={2} textAlignVertical="top" />
          </View>

          <View style={[am.stageBadge, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <Feather name="map-pin" size={13} color={colors.primary} />
            <Text style={[am.stageText, { color: colors.primary }]}>Stage: {stage}</Text>
          </View>

          <TouchableOpacity style={[am.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.75 : 1 }]}
            onPress={handleSave} disabled={saving} activeOpacity={0.8}>
            <Feather name="image" size={18} color="#fff" />
            <Text style={am.saveBtnText}>{saving ? "Saving…" : "Add to Journal"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function JournalScreen() {
  const { progressPhotos, addProgressPhoto, deleteProgressPhoto, project } = useApp();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showAdd, setShowAdd] = useState(false);
  const [viewer, setViewer] = useState<ProgressPhoto | null>(null);

  const handleDelete = (id: string) => {
    Alert.alert("Remove Photo", "Remove this photo from your progress journal?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteProgressPhoto(id) },
    ]);
  };

  // Group by month
  const grouped = progressPhotos.reduce((acc, p) => {
    const key = new Date(p.date).toLocaleDateString("en-KE", { month: "long", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, ProgressPhoto[]>);

  return (
    <View style={[jc.root, { backgroundColor: colors.background }]}>
      <View style={[jc.header, { paddingTop: insets.top + 14, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={jc.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[jc.title, { color: colors.foreground }]}>Progress Journal</Text>
          <Text style={[jc.subtitle, { color: colors.mutedForeground }]}>
            {progressPhotos.length} photo{progressPhotos.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity style={[jc.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAdd(true)}>
          <Feather name="camera" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[jc.content, { paddingBottom: insets.bottom + 40 }]}>
        {progressPhotos.length === 0 ? (
          <View style={jc.empty}>
            <View style={[jc.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="camera" size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[jc.emptyTitle, { color: colors.foreground }]}>Start Your Photo Journal</Text>
            <Text style={[jc.emptyBody, { color: colors.mutedForeground }]}>
              Take weekly progress photos to document your construction. Useful for insurance, bank valuations, and contractor disputes.
            </Text>
            <TouchableOpacity style={[jc.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAdd(true)}>
              <Feather name="camera" size={16} color="#fff" />
              <Text style={jc.emptyBtnText}>Add First Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.entries(grouped).map(([month, photos]) => (
            <View key={month} style={jc.monthGroup}>
              <Text style={[jc.monthHeader, { color: colors.mutedForeground }]}>{month}</Text>
              <View style={jc.grid}>
                {photos.map((photo) => (
                  <View key={photo.id} style={jc.photoWrap}>
                    <TouchableOpacity onPress={() => setViewer(photo)} activeOpacity={0.9}>
                      <Image source={{ uri: photo.uri }} style={[jc.thumb, { width: THUMB_SIZE, height: THUMB_SIZE * 0.8 }]} resizeMode="cover" />
                      <View style={jc.thumbOverlay}>
                        <View style={jc.stampRow}>
                          <Feather name="calendar" size={9} color="rgba(255,255,255,0.8)" />
                          <Text style={jc.stampDate}>{fmtDate(photo.date)}</Text>
                        </View>
                        <View style={[jc.stagePill]}>
                          <Text style={jc.stagePillText}>{photo.stage}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {photo.caption ? (
                      <Text style={[jc.caption, { color: colors.foreground }]} numberOfLines={2}>{photo.caption}</Text>
                    ) : null}
                    <TouchableOpacity onPress={() => handleDelete(photo.id)} style={[jc.deleteBtn, { backgroundColor: colors.destructive + "15" }]}>
                      <Feather name="trash-2" size={12} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <AddPhotoModal
        visible={showAdd}
        stage={project?.stage ?? "Foundation"}
        onSave={async (uri, caption) => {
          await addProgressPhoto({ uri, caption: caption || undefined, date: new Date().toISOString(), stage: project?.stage ?? "Foundation" });
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        onClose={() => setShowAdd(false)}
        colors={colors}
      />

      <PhotoViewer
        uri={viewer?.uri ?? null}
        timestamp={viewer?.date}
        notes={viewer?.caption}
        materialName={viewer ? `${viewer.stage} · ${fmtDate(viewer.date)}` : undefined}
        onClose={() => setViewer(null)}
      />
    </View>
  );
}

const am = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  closeBtn: { padding: 6 },
  title: { fontSize: 17, fontFamily: "Manrope_700Bold", textAlign: "center" },
  content: { padding: 20, gap: 0 },
  previewWrap: { borderRadius: 16, overflow: "hidden", height: 240, marginBottom: 20, position: "relative" },
  preview: { width: "100%", height: "100%" },
  removeOverlay: { position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  pickerRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  pickerBtn: { flex: 1, height: 100, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", justifyContent: "center", alignItems: "center", gap: 8 },
  pickerBtnText: { fontSize: 14, fontFamily: "Manrope_600SemiBold" },
  field: { marginBottom: 16 },
  label: { fontSize: 11, fontFamily: "Manrope_700Bold", letterSpacing: 0.8, marginBottom: 8 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Manrope_400Regular", minHeight: 80 },
  stageBadge: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 16 },
  stageText: { fontSize: 13, fontFamily: "Manrope_600SemiBold" },
  saveBtn: { height: 58, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  saveBtnText: { color: "#fff", fontSize: 17, fontFamily: "Manrope_700Bold" },
});

const jc = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 6 },
  addBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 17, fontFamily: "Manrope_700Bold", textAlign: "center" },
  subtitle: { fontSize: 12, fontFamily: "Manrope_400Regular", textAlign: "center" },
  content: { padding: 16 },
  empty: { alignItems: "center", gap: 16, paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 20, fontFamily: "Manrope_800ExtraBold", textAlign: "center" },
  emptyBody: { fontSize: 14, fontFamily: "Manrope_400Regular", textAlign: "center", lineHeight: 22 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 4 },
  emptyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Manrope_700Bold" },
  monthGroup: { marginBottom: 24 },
  monthHeader: { fontSize: 12, fontFamily: "Manrope_700Bold", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoWrap: { position: "relative" },
  thumb: { borderRadius: 12, overflow: "hidden" as const },
  thumbOverlay: { position: "absolute", bottom: 0, left: 0, borderRadius: 12, padding: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", right: 0, backgroundColor: "rgba(0,0,0,0.45)" },
  stampRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  stampDate: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontFamily: "Manrope_500Medium" },
  stagePill: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  stagePillText: { color: "#fff", fontSize: 10, fontFamily: "Manrope_600SemiBold" },
  caption: { fontSize: 12, fontFamily: "Manrope_400Regular", marginTop: 5, lineHeight: 17, maxWidth: THUMB_SIZE },
  deleteBtn: { position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },
});
