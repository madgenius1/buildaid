import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { PhotoCapture } from "@/components/PhotoCapture";

const WORKER_QUICK = [1, 2, 3, 5, 8, 10, 15, 20];

export default function NewReportScreen() {
  const { addSiteReport, project } = useApp();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [workers, setWorkers] = useState("");
  const [workDone, setWorkDone] = useState("");
  const [incidents, setIncidents] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [timestamp] = useState(new Date().toISOString());

  const handleSave = async () => {
    if (!workers || parseInt(workers) < 0) {
      Alert.alert("Workers required", "How many workers were on site today?");
      return;
    }
    if (!workDone.trim()) {
      Alert.alert("Work done required", "Please describe what was done today.");
      return;
    }
    setSaving(true);
    try {
      await addSiteReport({
        date: timestamp,
        workers: parseInt(workers) || 0,
        workDone: workDone.trim(),
        incidents: incidents.trim() || undefined,
        stage: project?.stage ?? "Foundation",
        photoUri: photoUri ?? undefined,
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
          <Text style={[s.title, { color: colors.foreground }]}>Daily Site Report</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
            {new Date(timestamp).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" })}
          </Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Workers */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>WORKERS ON SITE</Text>
          <TextInput
            style={[s.bigInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="0" placeholderTextColor={colors.mutedForeground}
            value={workers} onChangeText={setWorkers} keyboardType="number-pad" autoFocus />
          <View style={s.quickRow}>
            {WORKER_QUICK.map((n) => (
              <TouchableOpacity key={n}
                style={[s.quickBtn, { backgroundColor: workers === n.toString() ? colors.primary : colors.card, borderColor: workers === n.toString() ? colors.primary : colors.border }]}
                onPress={() => setWorkers(n.toString())}>
                <Text style={[s.quickBtnText, { color: workers === n.toString() ? colors.primaryForeground : colors.foreground }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Work done */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>WORK DONE TODAY</Text>
          <TextInput
            style={[s.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. Foundation slab poured on east wing. Plinth beam cast on grid A-D. 4 columns cast to DPC level..."
            placeholderTextColor={colors.mutedForeground}
            value={workDone} onChangeText={setWorkDone} multiline numberOfLines={4} textAlignVertical="top" />
        </View>

        {/* Site photo */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>SITE PHOTO — optional</Text>
          <PhotoCapture photoUri={photoUri} timestamp={timestamp} label="Photograph Today's Progress"
            onCapture={setPhotoUri} onRemove={() => setPhotoUri(null)} />
        </View>

        {/* Incidents */}
        <View style={s.field}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>INCIDENTS / ISSUES — optional</Text>
          <TextInput
            style={[s.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. Concrete mixer broke down at 2pm. Worker injured — minor cut. Supplier delivered wrong grade..."
            placeholderTextColor={colors.mutedForeground}
            value={incidents} onChangeText={setIncidents} multiline numberOfLines={3} textAlignVertical="top" />
        </View>

        {/* Stage indicator */}
        <View style={[s.stageBanner, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Feather name="map-pin" size={13} color={colors.primary} />
          <Text style={[s.stageText, { color: colors.primary }]}>
            Stage: {project?.stage ?? "Foundation"}
          </Text>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.75 : 1 }]}
          onPress={handleSave} disabled={saving} activeOpacity={0.8}>
          <Feather name="clipboard" size={18} color="#fff" />
          <Text style={s.saveBtnText}>{saving ? "Saving…" : "Save Report"}</Text>
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
  bigInput: { height: 60, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 18, fontSize: 28, fontFamily: "Manrope_800ExtraBold" },
  textArea: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontFamily: "Manrope_400Regular", minHeight: 110 },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5 },
  quickBtnText: { fontSize: 14, fontFamily: "Manrope_700Bold" },
  stageBanner: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 16 },
  stageText: { fontSize: 13, fontFamily: "Manrope_600SemiBold" },
  saveBtn: { height: 58, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  saveBtnText: { color: "#fff", fontSize: 17, fontFamily: "Manrope_700Bold" },
});
