import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { getBaseline } from "@/utils/baseline";

export default function MaterialsScreen() {
  const { materials, alerts, project } = useApp();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : insets.bottom + 84;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          s.header,
          {
            paddingTop: topPad + 16,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Materials</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>
            {project?.stage} stage · {materials.length} materials
          </Text>
        </View>
        <TouchableOpacity
          style={[s.manageBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={() => router.push("/materials-manage" as any)}
        >
          <Feather name="settings" size={14} color={colors.foreground} />
          <Text style={[s.manageBtnText, { color: colors.foreground }]}>Manage</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.list, { paddingBottom: bottomPad }]}
      >
        {materials.map((mat) => {
          const remaining = mat.purchased - mat.used;
          const matAlerts = alerts.filter((a) => a.materialId === mat.id);
          const hasAlert = matAlerts.length > 0;
          const hasCritical = matAlerts.some((a) => a.severity === "critical");
          const usedPct = mat.purchased > 0 ? Math.min(mat.used / mat.purchased, 1) : 0;
          const deliveredPct = mat.purchased > 0 ? Math.min(mat.delivered / mat.purchased, 1) : 0;
          const baseline = project ? getBaseline(mat.name, project.stage) : null;
          const expectedMax = baseline && project ? baseline.max * project.area : null;
          const expectedPct = expectedMax && mat.purchased > 0 ? Math.min(expectedMax / mat.purchased, 1) : null;

          const statusLabel =
            mat.purchased === 0 ? "No data"
            : hasCritical ? "Needs attention"
            : hasAlert ? "Check this"
            : "On track";

          const statusColor =
            mat.purchased === 0 ? colors.mutedForeground
            : hasCritical ? colors.destructive
            : hasAlert ? colors.warning
            : colors.success;

          return (
            <TouchableOpacity
              key={mat.id}
              style={[
                s.card,
                {
                  backgroundColor: colors.card,
                  borderColor: hasCritical
                    ? colors.destructive + "50"
                    : hasAlert
                    ? colors.warning + "50"
                    : colors.border,
                },
              ]}
              onPress={() => router.push(`/material/${mat.id}` as any)}
              activeOpacity={0.75}
            >
              <View style={s.cardHeader}>
                <View>
                  <View style={s.nameRow}>
                    <Text style={[s.matName, { color: colors.foreground }]}>{mat.name}</Text>
                    {mat.isCustom ? (
                      <View style={[s.customBadge, { backgroundColor: colors.primary + "15" }]}>
                        <Text style={[s.customBadgeText, { color: colors.primary }]}>Custom</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[s.matUnit, { color: colors.mutedForeground }]}>in {mat.unit}</Text>
                </View>
                <View style={s.cardRight}>
                  <View style={[s.statusPill, { backgroundColor: statusColor + "18" }]}>
                    <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </View>
              </View>

              {mat.purchased > 0 ? (
                <>
                  <View style={s.statsGrid}>
                    {[
                      { label: "Purchased", value: mat.purchased },
                      { label: "Delivered", value: mat.delivered },
                      { label: "Used", value: mat.used },
                      { label: "Left", value: remaining, isNeg: remaining < 0 },
                    ].map((item) => (
                      <View key={item.label} style={s.statBox}>
                        <Text
                          style={[
                            s.statValue,
                            { color: item.isNeg ? colors.destructive : colors.foreground },
                          ]}
                        >
                          {item.value}
                        </Text>
                        <Text style={[s.statLabel, { color: colors.mutedForeground }]}>
                          {item.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={s.barsSection}>
                    <BarRow label="Delivered" pct={deliveredPct} color="#8B5CF6" colors={colors} />
                    <BarRow
                      label="Used"
                      pct={usedPct}
                      color={usedPct > 0.9 ? colors.destructive : usedPct > 0.7 ? colors.warning : colors.primary}
                      expectedPct={expectedPct ?? undefined}
                      colors={colors}
                    />
                  </View>

                  {hasAlert ? (
                    <View
                      style={[
                        s.alertSnippet,
                        { backgroundColor: hasCritical ? colors.destructive + "10" : colors.warning + "10" },
                      ]}
                    >
                      <Feather
                        name={hasCritical ? "alert-circle" : "alert-triangle"}
                        size={13}
                        color={hasCritical ? colors.destructive : colors.warning}
                      />
                      <Text
                        style={[
                          s.alertSnippetText,
                          { color: hasCritical ? colors.destructive : colors.warning },
                        ]}
                        numberOfLines={2}
                      >
                        {matAlerts[0].message}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={s.emptyState}>
                  <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No entries yet</Text>
                  <TouchableOpacity
                    style={[s.logNowBtn, { backgroundColor: colors.primary + "15" }]}
                    onPress={() => router.push("/log/purchase")}
                  >
                    <Text style={[s.logNowText, { color: colors.primary }]}>Log first purchase</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function BarRow({ label, pct, color, expectedPct, colors }: {
  label: string;
  pct: number;
  color: string;
  expectedPct?: number;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={bs.row}>
      <Text style={[bs.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[bs.track, { backgroundColor: colors.secondary }]}>
        <View style={[bs.fill, { width: `${Math.min(pct * 100, 100)}%` as any, backgroundColor: color }]} />
        {expectedPct != null ? (
          <View style={[bs.marker, { left: `${Math.min(expectedPct * 100, 100)}%` as any, backgroundColor: colors.mutedForeground + "80" }]} />
        ) : null}
      </View>
      <Text style={[bs.pct, { color: colors.mutedForeground }]}>{Math.round(pct * 100)}%</Text>
    </View>
  );
}

const bs = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 11, fontFamily: "Manrope_500Medium", width: 60 },
  track: { flex: 1, height: 5, borderRadius: 3, overflow: "hidden", position: "relative" },
  fill: { height: 5, borderRadius: 3 },
  marker: { position: "absolute", top: 0, width: 2, height: 5 },
  pct: { fontSize: 11, fontFamily: "Manrope_500Medium", width: 32, textAlign: "right" },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontFamily: "Manrope_800ExtraBold" },
  headerSub: { fontSize: 13, fontFamily: "Manrope_400Regular", marginTop: 2 },
  manageBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  manageBtnText: { fontSize: 13, fontFamily: "Manrope_600SemiBold" },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  matName: { fontSize: 17, fontFamily: "Manrope_800ExtraBold" },
  customBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  customBadgeText: { fontSize: 11, fontFamily: "Manrope_600SemiBold" },
  matUnit: { fontSize: 12, fontFamily: "Manrope_400Regular", marginTop: 2 },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 12, fontFamily: "Manrope_600SemiBold" },
  statsGrid: { flexDirection: "row" },
  statBox: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontSize: 20, fontFamily: "Manrope_800ExtraBold" },
  statLabel: { fontSize: 11, fontFamily: "Manrope_400Regular" },
  barsSection: { gap: 6 },
  alertSnippet: { flexDirection: "row", alignItems: "flex-start", gap: 7, borderRadius: 8, padding: 10 },
  alertSnippetText: { flex: 1, fontSize: 12, fontFamily: "Manrope_500Medium", lineHeight: 17 },
  emptyState: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  emptyText: { fontSize: 13, fontFamily: "Manrope_400Regular" },
  logNowBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  logNowText: { fontSize: 13, fontFamily: "Manrope_600SemiBold" },
});
