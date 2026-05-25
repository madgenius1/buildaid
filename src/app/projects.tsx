import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, Project } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function fmtKsh(n: number) {
  if (n >= 1_000_000) return `KSh ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KSh ${(n / 1_000).toFixed(0)}K`;
  return `KSh ${n}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProjectsScreen() {
  const { allProjects, project, switchProject, deleteProject } = useApp();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [switching, setSwitching] = useState<string | null>(null);

  const handleSwitch = async (p: Project) => {
    if (p.id === project?.id) {
      router.back();
      return;
    }
    setSwitching(p.id);
    try {
      await switchProject(p.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSwitching(null);
    }
  };

  const handleDelete = (p: Project) => {
    Alert.alert(
      "Delete Project",
      `Delete "${p.name}"? All materials, transactions, and photos will be permanently removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteProject(p.id);
            if (allProjects.length === 1) {
              router.replace("/onboarding");
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
            paddingTop: insets.top + 16,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[s.title, { color: colors.foreground }]}>Projects</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
            {allProjects.length} project{allProjects.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/onboarding?mode=new" as any)}
        >
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 32 }]}
      >
        {allProjects.length === 0 ? (
          <View style={s.empty}>
            <Feather name="folder" size={40} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
              No projects yet
            </Text>
          </View>
        ) : (
          allProjects.map((p) => {
            const isActive = p.id === project?.id;
            const isLoading = switching === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  s.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                    borderWidth: isActive ? 2 : 1,
                  },
                ]}
                onPress={() => handleSwitch(p)}
                activeOpacity={0.75}
              >
                <View style={s.cardMain}>
                  <View style={s.cardLeft}>
                    <View
                      style={[
                        s.projectIcon,
                        {
                          backgroundColor: isActive
                            ? colors.primary
                            : colors.secondary,
                        },
                      ]}
                    >
                      <Feather
                        name="home"
                        size={18}
                        color={isActive ? "#fff" : colors.mutedForeground}
                      />
                    </View>
                    <View>
                      <Text style={[s.projectName, { color: colors.foreground }]}>
                        {p.name}
                      </Text>
                      <Text style={[s.projectMeta, { color: colors.mutedForeground }]}>
                        {p.stage} · {p.area} m² · {fmtKsh(p.budget)}
                      </Text>
                      <Text style={[s.projectDate, { color: colors.mutedForeground }]}>
                        Created {fmtDate(p.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={s.cardRight}>
                    {isActive ? (
                      <View
                        style={[
                          s.activePill,
                          { backgroundColor: colors.primary + "18" },
                        ]}
                      >
                        <Text style={[s.activePillText, { color: colors.primary }]}>
                          Active
                        </Text>
                      </View>
                    ) : isLoading ? (
                      <Text style={[s.loadingText, { color: colors.mutedForeground }]}>
                        Loading…
                      </Text>
                    ) : (
                      <Feather
                        name="chevron-right"
                        size={16}
                        color={colors.mutedForeground}
                      />
                    )}
                  </View>
                </View>

                {/* Build type badge */}
                <View style={s.cardFooter}>
                  <View
                    style={[
                      s.typeBadge,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <Text style={[s.typeBadgeText, { color: colors.mutedForeground }]}>
                      {p.buildType} · {p.floors} floor{p.floors !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(p)}
                    style={s.deleteBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="trash-2" size={15} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Add new project card */}
        <TouchableOpacity
          style={[
            s.addCard,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
          onPress={() => router.push("/onboarding?mode=new" as any)}
          activeOpacity={0.75}
        >
          <View style={[s.addCardIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="plus-circle" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={[s.addCardTitle, { color: colors.foreground }]}>
              New Project
            </Text>
            <Text style={[s.addCardSub, { color: colors.mutedForeground }]}>
              Track a new construction site
            </Text>
          </View>
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  list: { padding: 16, gap: 10 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 15, fontFamily: "Manrope_400Regular" },
  card: { borderRadius: 16, padding: 14, gap: 10 },
  cardMain: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardLeft: { flexDirection: "row", gap: 12, alignItems: "flex-start", flex: 1 },
  projectIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  projectName: { fontSize: 16, fontFamily: "Manrope_700Bold", marginBottom: 2 },
  projectMeta: { fontSize: 13, fontFamily: "Manrope_400Regular", marginBottom: 1 },
  projectDate: { fontSize: 12, fontFamily: "Manrope_400Regular" },
  cardRight: { paddingTop: 2 },
  activePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activePillText: { fontSize: 12, fontFamily: "Manrope_700Bold" },
  loadingText: { fontSize: 13, fontFamily: "Manrope_400Regular" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  typeBadgeText: { fontSize: 12, fontFamily: "Manrope_500Medium" },
  deleteBtn: { padding: 4 },
  addCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  addCardIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  addCardTitle: { fontSize: 15, fontFamily: "Manrope_700Bold", marginBottom: 2 },
  addCardSub: { fontSize: 13, fontFamily: "Manrope_400Regular" },
});
