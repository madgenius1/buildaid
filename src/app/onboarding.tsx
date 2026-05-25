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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, Stage } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type BuildType = "Basic" | "Standard" | "Premium";

const BUILD_TYPES: { value: BuildType; desc: string }[] = [
  { value: "Basic", desc: "Simple finishes" },
  { value: "Standard", desc: "Mid-range" },
  { value: "Premium", desc: "High-end" },
];

export default function OnboardingScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isAddNew = mode === "new";

  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [area, setArea] = useState("");
  const [floors, setFloors] = useState<1 | 2 | 3>(1);
  const [buildType, setBuildType] = useState<BuildType>("Standard");
  const [isLoading, setIsLoading] = useState(false);
  const { createProject } = useApp();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const isDemo = area === "200";

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Project Name", "Please enter a name for your project.");
      return;
    }
    const budgetNum = parseFloat(budget.replace(/,/g, ""));
    const areaNum = parseFloat(area.replace(/,/g, ""));
    if (isNaN(budgetNum) || budgetNum <= 0) {
      Alert.alert("Budget", "Please enter a valid budget amount.");
      return;
    }
    if (isNaN(areaNum) || areaNum <= 0) {
      Alert.alert("Area", "Please enter a valid built-up area.");
      return;
    }
    setIsLoading(true);
    try {
      await createProject({
        name: name.trim(),
        budget: budgetNum,
        area: areaNum,
        floors,
        buildType,
        stage: "Foundation" as Stage,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          {
            paddingTop: Math.max(insets.top + 24, 48),
            paddingBottom: insets.bottom + 48,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isAddNew ? (
          <View style={s.topRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={s.badgeRow}>
          <View style={[s.stepBadge, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[s.stepText, { color: colors.primary }]}>
              {isAddNew ? "New Project" : "One-time setup"}
            </Text>
          </View>
        </View>

        <Text style={[s.title, { color: colors.foreground }]}>
          {isAddNew ? "Add New Project" : "Set Up Your Project"}
        </Text>
        <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
          {isAddNew
            ? "Add a new construction site to track alongside your existing projects."
            : "This takes 30 seconds. You can change everything later."}
        </Text>

        <View style={s.field}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>PROJECT NAME</Text>
          <TextInput
            style={[
              s.input,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="e.g. My Home, Karen Plot, Westlands Office"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        <View style={s.field}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>TOTAL BUDGET (KSh)</Text>
          <TextInput
            style={[
              s.input,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="5,000,000"
            placeholderTextColor={colors.mutedForeground}
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
          />
        </View>

        <View style={s.field}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>BUILT-UP AREA (m²)</Text>
          <TextInput
            style={[
              s.input,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="120"
            placeholderTextColor={colors.mutedForeground}
            value={area}
            onChangeText={setArea}
            keyboardType="numeric"
          />
          {isDemo ? (
            <View style={[s.demoBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
              <Feather name="zap" size={13} color={colors.primary} />
              <Text style={[s.demoBannerText, { color: colors.primary }]}>
                200m² — demo data with alerts will be pre-loaded
              </Text>
            </View>
          ) : null}
        </View>

        <View style={s.field}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>NUMBER OF FLOORS</Text>
          <View style={s.chipRow}>
            {([1, 2, 3] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  s.chip,
                  {
                    backgroundColor: floors === f ? colors.primary : colors.card,
                    borderColor: floors === f ? colors.primary : colors.border,
                    flex: 1,
                  },
                ]}
                onPress={() => setFloors(f)}
              >
                <Text
                  style={[
                    s.chipText,
                    { color: floors === f ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {f === 3 ? "3+" : f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.field}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>BUILD TYPE</Text>
          <View style={s.chipRow}>
            {BUILD_TYPES.map((bt) => (
              <TouchableOpacity
                key={bt.value}
                style={[
                  s.chip,
                  {
                    backgroundColor: buildType === bt.value ? colors.primary : colors.card,
                    borderColor: buildType === bt.value ? colors.primary : colors.border,
                    flex: 1,
                  },
                ]}
                onPress={() => setBuildType(bt.value)}
              >
                <Text
                  style={[
                    s.chipText,
                    { color: buildType === bt.value ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {bt.value}
                </Text>
                <Text
                  style={[
                    s.chipSub,
                    {
                      color:
                        buildType === bt.value
                          ? colors.primaryForeground + "CC"
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {bt.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.75 : 1 }]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Feather name="arrow-right" size={18} color="#fff" />
          <Text style={s.submitText}>
            {isLoading ? "Setting up…" : isAddNew ? "Create Project" : "Start Project"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  topRow: { marginBottom: 8 },
  backBtn: { padding: 4 },
  badgeRow: { marginBottom: 16 },
  stepBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stepText: { fontSize: 12, fontFamily: "Manrope_600SemiBold" },
  title: { fontSize: 26, fontFamily: "Manrope_800ExtraBold", marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: "Manrope_400Regular", marginBottom: 32, lineHeight: 22 },
  field: { marginBottom: 24, gap: 8 },
  label: { fontSize: 11, fontFamily: "Manrope_700Bold", letterSpacing: 0.8 },
  input: { height: 52, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, fontFamily: "Manrope_500Medium" },
  demoBanner: {
    flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 10, borderWidth: 1, padding: 10,
  },
  demoBannerText: { fontSize: 13, fontFamily: "Manrope_600SemiBold", flex: 1 },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, alignItems: "center", gap: 2 },
  chipText: { fontSize: 14, fontFamily: "Manrope_700Bold" },
  chipSub: { fontSize: 11, fontFamily: "Manrope_400Regular" },
  submitBtn: {
    height: 58, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 8,
  },
  submitText: { color: "#fff", fontSize: 17, fontFamily: "Manrope_700Bold" },
});
