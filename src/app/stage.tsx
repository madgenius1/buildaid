import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, Stage } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const STAGES: { stage: Stage; description: string; icon: string }[] = [
  {
    stage: "Foundation",
    description: "Ground works, footings, slab",
    icon: "layers",
  },
  {
    stage: "Walling",
    description: "Block/brick work, columns, beams",
    icon: "square",
  },
  {
    stage: "Roofing",
    description: "Roof structure and covering",
    icon: "home",
  },
  {
    stage: "Finishing",
    description: "Plastering, tiling, painting",
    icon: "edit-3",
  },
];

export default function StageScreen() {
  const { project, setStage } = useApp();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleSelect = async (stage: Stage) => {
    await setStage(stage);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          s.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.foreground }]}>
          Select Stage
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[s.content, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
          Your current stage affects expected material usage ranges
        </Text>
        {STAGES.map((item) => {
          const isSelected = project?.stage === item.stage;
          return (
            <TouchableOpacity
              key={item.stage}
              style={[
                s.stageCard,
                {
                  backgroundColor: isSelected
                    ? colors.primary + "12"
                    : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleSelect(item.stage)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  s.iconBox,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : colors.secondary,
                  },
                ]}
              >
                <Feather
                  name={item.icon as any}
                  size={20}
                  color={isSelected ? "#fff" : colors.mutedForeground}
                />
              </View>
              <View style={s.stageInfo}>
                <Text
                  style={[
                    s.stageName,
                    {
                      color: isSelected ? colors.primary : colors.foreground,
                    },
                  ]}
                >
                  {item.stage}
                </Text>
                <Text
                  style={[s.stageDesc, { color: colors.mutedForeground }]}
                >
                  {item.description}
                </Text>
              </View>
              {isSelected ? (
                <Feather name="check-circle" size={20} color={colors.primary} />
              ) : (
                <Feather
                  name="circle"
                  size={20}
                  color={colors.mutedForeground}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
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
  title: {
    fontSize: 17,
    fontWeight: "700" as const,
    fontFamily: "Manrope_700Bold",
  },
  content: { padding: 20, gap: 12 },
  subtitle: {
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    marginBottom: 8,
    lineHeight: 20,
  },
  stageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  stageInfo: { flex: 1 },
  stageName: {
    fontSize: 16,
    fontWeight: "700" as const,
    fontFamily: "Manrope_700Bold",
  },
  stageDesc: { fontSize: 13, fontFamily: "Manrope_400Regular", marginTop: 2 },
});
