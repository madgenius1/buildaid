import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { computeForecast } from "@/utils/forecast";
import { ExportButton } from "@/components/ExportButton";

function fmtKsh(n: number) {
  if (Math.abs(n) >= 1_000_000) return `KSh ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `KSh ${(n / 1_000).toFixed(0)}K`;
  return `KSh ${n.toFixed(0)}`;
}

export default function HomeScreen() {
  const { project, materials, alerts, totalSpent, totalLabourCost, transactions, allProjects } = useApp();
  const { signOut } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  // Tab bar heights: web=84, iOS≈49+safeArea, Android≈56
  const TAB_H = isWeb ? 84 : Platform.OS === "ios" ? 49 + insets.bottom : 56;
  const QA_PAD_BOTTOM = TAB_H + 4;
  const SCROLL_BOTTOM_PAD = QA_PAD_BOTTOM + 52 + 12 + 16; // qaBottomPad + buttonH + paddingTop + gap

  const remaining = project ? project.budget - totalSpent : 0;
  const spentPct = project ? Math.min(totalSpent / project.budget, 1) : 0;
  const forecast = project
    ? computeForecast(transactions, project.budget, totalSpent)
    : null;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth/phone");
        },
      },
    ]);
  };

  if (!project) return null;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SCROLL_BOTTOM_PAD }}
      >
        {/* Header */}
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
          <View style={s.headerLeft}>
            <View style={s.projectNameRow}>
              <Text style={[s.projectName, { color: colors.foreground }]}>
                {project.name}
              </Text>
              {allProjects.length > 1 ? (
                <TouchableOpacity
                  onPress={() => router.push("/projects" as any)}
                  style={[s.switchBtn, { backgroundColor: colors.secondary }]}
                >
                  <Feather name="repeat" size={12} color={colors.mutedForeground} />
                  <Text style={[s.switchBtnText, { color: colors.mutedForeground }]}>
                    Switch
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={s.headerBadges}>
              <TouchableOpacity
                onPress={() => router.push("/stage")}
                style={[s.stageBadge, { backgroundColor: colors.primary + "1A" }]}
              >
                <Feather name="map-pin" size={11} color={colors.primary} />
                <Text style={[s.stageText, { color: colors.primary }]}>
                  {project.stage}
                </Text>
                <Feather name="chevron-down" size={11} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/projects" as any)}
                style={[s.projectsBadge, { backgroundColor: colors.secondary }]}
              >
                <Feather name="folder" size={11} color={colors.mutedForeground} />
                <Text style={[s.projectsText, { color: colors.mutedForeground }]}>
                  {allProjects.length} project{allProjects.length !== 1 ? "s" : ""}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity onPress={() => router.push("/journal" as any)} style={s.signOutBtn}>
              <Feather name="camera" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/suppliers" as any)} style={s.signOutBtn}>
              <Feather name="book" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <ExportButton minimal />
            <TouchableOpacity onPress={handleSignOut} style={s.signOutBtn}>
              <Feather name="log-out" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Budget summary */}
        <View
          style={[
            s.budgetCard,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <View style={s.budgetRow}>
            <BudgetStat label="Budget" value={fmtKsh(project.budget)} colors={colors} />
            <View style={[s.budgetDivider, { backgroundColor: colors.border }]} />
            <BudgetStat label="Materials" value={fmtKsh(totalSpent)} colors={colors} />
            {totalLabourCost > 0 ? (
              <>
                <View style={[s.budgetDivider, { backgroundColor: colors.border }]} />
                <BudgetStat label="Labour" value={fmtKsh(totalLabourCost)} colors={colors} />
              </>
            ) : null}
            <View style={[s.budgetDivider, { backgroundColor: colors.border }]} />
            <BudgetStat
              label="Left"
              value={fmtKsh(Math.abs(remaining))}
              valueColor={remaining < 0 ? colors.destructive : colors.success}
              prefix={remaining < 0 ? "-" : ""}
              colors={colors}
            />
          </View>
          <View style={[s.progressTrack, { backgroundColor: colors.secondary }]}>
            <View
              style={[
                s.progressFill,
                {
                  width: `${Math.min(spentPct * 100, 100)}%` as any,
                  backgroundColor:
                    spentPct >= 1
                      ? colors.destructive
                      : spentPct > 0.8
                      ? colors.warning
                      : colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[s.progressLabel, { color: colors.mutedForeground }]}>
            {Math.round(spentPct * 100)}% of budget used
          </Text>
        </View>

        {/* Forecast card */}
        {forecast ? (
          <View style={s.section}>
            <View
              style={[
                s.forecastCard,
                {
                  backgroundColor: forecast.isOverBudget
                    ? colors.destructive + "10"
                    : colors.success + "10",
                  borderColor: forecast.isOverBudget
                    ? colors.destructive + "40"
                    : colors.success + "40",
                },
              ]}
            >
              <View style={s.forecastLeft}>
                <Feather
                  name="trending-up"
                  size={16}
                  color={forecast.isOverBudget ? colors.destructive : colors.success}
                />
                <Text
                  style={[
                    s.forecastTitle,
                    { color: forecast.isOverBudget ? colors.destructive : colors.success },
                  ]}
                >
                  Spending Forecast
                </Text>
              </View>
              <View style={s.forecastStats}>
                <View style={s.forecastStat}>
                  <Text style={[s.forecastValue, { color: colors.foreground }]}>
                    {fmtKsh(forecast.dailySpendRate)}
                  </Text>
                  <Text style={[s.forecastLabel, { color: colors.mutedForeground }]}>
                    per day
                  </Text>
                </View>
                <View style={[s.forecastDivider, { backgroundColor: colors.border }]} />
                <View style={s.forecastStat}>
                  <Text
                    style={[
                      s.forecastValue,
                      {
                        color:
                          forecast.daysRemaining < 30
                            ? colors.destructive
                            : colors.foreground,
                      },
                    ]}
                  >
                    {forecast.daysRemaining > 999 ? "∞" : `${forecast.daysRemaining}`}
                  </Text>
                  <Text style={[s.forecastLabel, { color: colors.mutedForeground }]}>
                    days left on budget
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Alerts */}
        {alerts.length > 0 ? (
          <View style={s.section}>
            <SectionHeader title="Alerts" count={alerts.length} colors={colors} />
            {alerts.map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={[
                  s.alertCard,
                  {
                    backgroundColor:
                      alert.severity === "critical"
                        ? colors.destructive + "12"
                        : colors.warning + "12",
                    borderLeftColor:
                      alert.severity === "critical"
                        ? colors.destructive
                        : colors.warning,
                  },
                ]}
                onPress={() =>
                  alert.materialId
                    ? router.push(`/material/${alert.materialId}` as any)
                    : null
                }
                activeOpacity={0.75}
              >
                <Feather
                  name={alert.severity === "critical" ? "alert-circle" : "alert-triangle"}
                  size={18}
                  color={alert.severity === "critical" ? colors.destructive : colors.warning}
                  style={{ flexShrink: 0 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[s.alertText, { color: colors.foreground }]} numberOfLines={3}>
                    {alert.message}
                  </Text>
                  {alert.materialId ? (
                    <Text style={[s.alertAction, { color: colors.primary }]}>
                      View details →
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Materials */}
        <View style={s.section}>
          <SectionHeader title="Materials" colors={colors} />
          {materials.map((mat) => {
            const used = mat.purchased > 0 ? mat.used / mat.purchased : 0;
            const delivered = mat.purchased > 0 ? mat.delivered / mat.purchased : 0;
            const rem = mat.purchased - mat.used;
            const matAlerts = alerts.filter((a) => a.materialId === mat.id);
            const hasCritical = matAlerts.some((a) => a.severity === "critical");
            const hasWarn = matAlerts.length > 0;

            return (
              <TouchableOpacity
                key={mat.id}
                style={[
                  s.matCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: hasCritical
                      ? colors.destructive + "60"
                      : hasWarn
                      ? colors.warning + "60"
                      : colors.border,
                  },
                ]}
                onPress={() => router.push(`/material/${mat.id}` as any)}
                activeOpacity={0.75}
              >
                <View style={s.matHeader}>
                  <Text style={[s.matName, { color: colors.foreground }]}>{mat.name}</Text>
                  <View style={s.matHeaderRight}>
                    {hasWarn ? (
                      <Feather
                        name={hasCritical ? "alert-circle" : "alert-triangle"}
                        size={14}
                        color={hasCritical ? colors.destructive : colors.warning}
                      />
                    ) : mat.purchased > 0 ? (
                      <View style={[s.statusDot, { backgroundColor: colors.success }]} />
                    ) : null}
                    <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                  </View>
                </View>

                {mat.purchased > 0 ? (
                  <>
                    <View style={s.matStats}>
                      {[
                        { label: "Bought", value: mat.purchased },
                        { label: "Delivered", value: mat.delivered },
                        { label: "Used", value: mat.used },
                        { label: "Left", value: rem, highlight: rem < 0 },
                      ].map((item) => (
                        <View key={item.label} style={s.matStat}>
                          <Text
                            style={[
                              s.statVal,
                              { color: item.highlight ? colors.destructive : colors.foreground },
                            ]}
                          >
                            {item.value}
                          </Text>
                          <Text style={[s.statLbl, { color: colors.mutedForeground }]}>
                            {item.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <View style={s.barsArea}>
                      <ProgressBar label="Delivered" pct={delivered} color="#8B5CF6" colors={colors} />
                      <ProgressBar
                        label="Used"
                        pct={used}
                        color={used > 0.9 ? colors.destructive : used > 0.7 ? colors.warning : colors.primary}
                        colors={colors}
                      />
                    </View>
                    <Text style={[s.matUnit, { color: colors.mutedForeground }]}>{mat.unit}</Text>
                  </>
                ) : (
                  <Text style={[s.noDataText, { color: colors.mutedForeground }]}>
                    No data yet — tap to log
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Quick Actions */}
      <View
        style={[
          s.quickActions,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: QA_PAD_BOTTOM,
          },
        ]}
      >
        {(
          [
            { label: "Purchase", icon: "shopping-cart" as const, route: "/log/purchase" },
            { label: "Delivery", icon: "truck" as const, route: "/log/delivery" },
            { label: "Usage", icon: "tool" as const, route: "/log/usage" },
          ] as const
        ).map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[s.actionBtn, { backgroundColor: colors.primary }]}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(action.route as any);
            }}
            activeOpacity={0.8}
          >
            <Feather name={action.icon} size={17} color="#fff" />
            <Text style={s.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function BudgetStat({ label, value, valueColor, prefix = "", colors }: {
  label: string;
  value: string;
  valueColor?: string;
  prefix?: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={s.budgetItem}>
      <Text style={[s.budgetLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[s.budgetValue, { color: valueColor ?? colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit>
        {prefix}{value}
      </Text>
    </View>
  );
}

function SectionHeader({ title, count, colors }: {
  title: string;
  count?: number;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={s.sectionHeaderRow}>
      <Text style={[s.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {count != null ? (
        <View style={[s.countBadge, { backgroundColor: colors.destructive }]}>
          <Text style={s.countText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ProgressBar({ label, pct, color, colors }: {
  label: string;
  pct: number;
  color: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={s.barRow}>
      <Text style={[s.barLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[s.barTrack, { backgroundColor: colors.secondary }]}>
        <View style={[s.barFill, { width: `${Math.min(pct * 100, 100)}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[s.barPct, { color: colors.mutedForeground }]}>{Math.round(pct * 100)}%</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: { gap: 8, flex: 1 },
  projectNameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  projectName: { fontSize: 22, fontFamily: "Manrope_800ExtraBold" },
  switchBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  switchBtnText: { fontSize: 12, fontFamily: "Manrope_600SemiBold" },
  headerBadges: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  stageBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  stageText: { fontSize: 13, fontFamily: "Manrope_600SemiBold" },
  projectsBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  projectsText: { fontSize: 13, fontFamily: "Manrope_500Medium" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 4 },
  signOutBtn: { padding: 4 },
  budgetCard: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1 },
  budgetRow: { flexDirection: "row", marginBottom: 14 },
  budgetItem: { flex: 1, alignItems: "center", gap: 4 },
  budgetDivider: { width: 1, marginVertical: 4 },
  budgetLabel: { fontSize: 12, fontFamily: "Manrope_500Medium" },
  budgetValue: { fontSize: 15, fontFamily: "Manrope_800ExtraBold", textAlign: "center" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: 12, fontFamily: "Manrope_400Regular" },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  forecastCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 4, gap: 10 },
  forecastLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  forecastTitle: { fontSize: 13, fontFamily: "Manrope_700Bold" },
  forecastStats: { flexDirection: "row", gap: 0, alignItems: "center" },
  forecastStat: { flex: 1, alignItems: "center", gap: 2 },
  forecastDivider: { width: 1, height: 32 },
  forecastValue: { fontSize: 20, fontFamily: "Manrope_800ExtraBold" },
  forecastLabel: { fontSize: 11, fontFamily: "Manrope_400Regular" },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Manrope_800ExtraBold" },
  countBadge: { minWidth: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center", paddingHorizontal: 5 },
  countText: { color: "#fff", fontSize: 11, fontFamily: "Manrope_700Bold" },
  alertCard: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 12, borderLeftWidth: 4, marginBottom: 8, alignItems: "flex-start" },
  alertText: { fontSize: 14, fontFamily: "Manrope_500Medium", lineHeight: 20, marginBottom: 4 },
  alertAction: { fontSize: 13, fontFamily: "Manrope_600SemiBold" },
  matCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10, gap: 10 },
  matHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  matHeaderRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  matName: { fontSize: 16, fontFamily: "Manrope_700Bold" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  matStats: { flexDirection: "row" },
  matStat: { flex: 1, alignItems: "center", gap: 2 },
  statVal: { fontSize: 18, fontFamily: "Manrope_800ExtraBold" },
  statLbl: { fontSize: 11, fontFamily: "Manrope_400Regular" },
  barsArea: { gap: 6 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { fontSize: 11, fontFamily: "Manrope_500Medium", width: 58 },
  barTrack: { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 5, borderRadius: 3 },
  barPct: { fontSize: 11, fontFamily: "Manrope_500Medium", width: 30, textAlign: "right" },
  matUnit: { fontSize: 11, fontFamily: "Manrope_400Regular", textAlign: "right" },
  noDataText: { fontSize: 13, fontFamily: "Manrope_400Regular" },
  quickActions: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  actionBtn: { flex: 1, height: 52, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  actionLabel: { color: "#fff", fontSize: 13, fontFamily: "Manrope_700Bold" },
});
