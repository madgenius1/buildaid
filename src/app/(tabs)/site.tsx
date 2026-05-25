import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert, Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp, SiteReport, Payment } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { PhotoViewer } from "@/components/PhotoViewer";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
function fmtKsh(n: number) {
  if (n >= 1_000_000) return `KSh ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KSh ${(n / 1_000).toFixed(0)}K`;
  return `KSh ${n.toFixed(0)}`;
}

const PAYMENT_COLORS: Record<string, string> = {
  fundi: "#8B5CF6",
  casual: "#3B82F6",
  contractor: "#F59E0B",
  other: "#6B7280",
};

const PAYMENT_LABELS: Record<string, string> = {
  fundi: "Fundi",
  casual: "Casual",
  contractor: "Contractor",
  other: "Other",
};

function ReportCard({ report, colors, onPhotoPress, onDelete }: {
  report: SiteReport;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  onPhotoPress: (uri: string, report: SiteReport) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={[rc.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={rc.cardHeader}>
        <View style={rc.headerLeft}>
          <View style={[rc.dateIcon, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="calendar" size={14} color={colors.primary} />
          </View>
          <View>
            <Text style={[rc.dateText, { color: colors.foreground }]}>{fmtDate(report.date)}</Text>
            <Text style={[rc.stageText, { color: colors.mutedForeground }]}>{report.stage}</Text>
          </View>
        </View>
        <View style={rc.headerRight}>
          <View style={[rc.workerBadge, { backgroundColor: colors.secondary }]}>
            <Feather name="users" size={12} color={colors.mutedForeground} />
            <Text style={[rc.workerCount, { color: colors.foreground }]}>{report.workers}</Text>
          </View>
          <TouchableOpacity onPress={() => onDelete(report.id)} style={rc.deleteBtn}>
            <Feather name="trash-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[rc.workDone, { color: colors.foreground }]}>{report.workDone}</Text>
      {report.incidents ? (
        <View style={[rc.incidentCard, { backgroundColor: colors.destructive + "10", borderColor: colors.destructive + "30" }]}>
          <Feather name="alert-triangle" size={13} color={colors.destructive} />
          <Text style={[rc.incidentText, { color: colors.destructive }]}>{report.incidents}</Text>
        </View>
      ) : null}
      {report.photoUri ? (
        <TouchableOpacity onPress={() => onPhotoPress(report.photoUri!, report)} style={rc.photoThumb}>
          <Image source={{ uri: report.photoUri }} style={rc.thumbImg} resizeMode="cover" />
          <View style={rc.photoOverlay}>
            <Feather name="camera" size={12} color="#fff" />
            <Text style={rc.photoLabel}>Site photo</Text>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function PaymentCard({ payment, colors, onDelete }: {
  payment: Payment;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  onDelete: (id: string) => void;
}) {
  const color = PAYMENT_COLORS[payment.type] ?? "#6B7280";
  return (
    <View style={[pc.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[pc.typeIcon, { backgroundColor: color + "18" }]}>
        <Feather name="briefcase" size={16} color={color} />
      </View>
      <View style={pc.info}>
        <View style={pc.infoTop}>
          <Text style={[pc.recipient, { color: colors.foreground }]}>{payment.recipient}</Text>
          <Text style={[pc.amount, { color: colors.foreground }]}>{fmtKsh(payment.amount)}</Text>
        </View>
        <View style={pc.infoBottom}>
          <View style={[pc.typePill, { backgroundColor: color + "18" }]}>
            <Text style={[pc.typeText, { color }]}>{PAYMENT_LABELS[payment.type]}</Text>
          </View>
          <Text style={[pc.date, { color: colors.mutedForeground }]}>{fmtDate(payment.date)}</Text>
        </View>
        {payment.description ? (
          <Text style={[pc.desc, { color: colors.mutedForeground }]} numberOfLines={1}>{payment.description}</Text>
        ) : null}
      </View>
      <TouchableOpacity onPress={() => onDelete(payment.id)} style={pc.deleteBtn}>
        <Feather name="trash-2" size={14} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

export default function SiteScreen() {
  const { siteReports, deleteSiteReport, payments, deletePayment, totalLabourCost, project } = useApp();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : insets.bottom + 84;

  const [activeTab, setActiveTab] = useState<"reports" | "payments">("reports");
  const [viewerPhoto, setViewerPhoto] = useState<{ uri: string; report: SiteReport } | null>(null);

  const handleDeleteReport = (id: string) => {
    Alert.alert("Delete Report", "Remove this daily report?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteSiteReport(id) },
    ]);
  };

  const handleDeletePayment = (id: string) => {
    Alert.alert("Delete Payment", "Remove this payment record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deletePayment(id) },
    ]);
  };

  const paymentsByType = payments.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] ?? 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>Site</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>{project?.stage ?? ""}</Text>
        </View>
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push(activeTab === "reports" ? "/report/new" : "/payment/new" as any)}
        >
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tab switcher */}
      <View style={[s.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(["reports", "payments"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Feather
              name={tab === "reports" ? "clipboard" : "dollar-sign"}
              size={14}
              color={activeTab === tab ? colors.primary : colors.mutedForeground}
            />
            <Text style={[s.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>
              {tab === "reports" ? `Reports (${siteReports.length})` : `Payments (${payments.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.list, { paddingBottom: bottomPad }]}>
        {activeTab === "reports" ? (
          siteReports.length === 0 ? (
            <View style={s.empty}>
              <View style={[s.emptyIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="clipboard" size={32} color={colors.mutedForeground} />
              </View>
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No reports yet</Text>
              <Text style={[s.emptyBody, { color: colors.mutedForeground }]}>
                Log your first daily site report to track worker attendance and progress
              </Text>
              <TouchableOpacity style={[s.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/report/new" as any)}>
                <Feather name="plus" size={16} color="#fff" />
                <Text style={s.emptyBtnText}>Add Daily Report</Text>
              </TouchableOpacity>
            </View>
          ) : (
            siteReports.map((r) => (
              <ReportCard key={r.id} report={r} colors={colors}
                onPhotoPress={(uri, report) => setViewerPhoto({ uri, report })}
                onDelete={handleDeleteReport} />
            ))
          )
        ) : (
          <>
            {/* Payments summary */}
            {payments.length > 0 ? (
              <View style={[s.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.summaryTitle, { color: colors.foreground }]}>Labour Spend Summary</Text>
                <View style={s.summaryGrid}>
                  {Object.entries(paymentsByType).map(([type, amount]) => (
                    <View key={type} style={s.summaryItem}>
                      <Text style={[s.summaryValue, { color: PAYMENT_COLORS[type] ?? colors.foreground }]}>{fmtKsh(amount)}</Text>
                      <Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>{PAYMENT_LABELS[type] ?? type}</Text>
                    </View>
                  ))}
                  <View style={[s.summaryItem, { borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: 16 }]}>
                    <Text style={[s.summaryValue, { color: colors.foreground }]}>{fmtKsh(totalLabourCost)}</Text>
                    <Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>Total</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {payments.length === 0 ? (
              <View style={s.empty}>
                <View style={[s.emptyIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="dollar-sign" size={32} color={colors.mutedForeground} />
                </View>
                <Text style={[s.emptyTitle, { color: colors.foreground }]}>No payments yet</Text>
                <Text style={[s.emptyBody, { color: colors.mutedForeground }]}>
                  Track payments to fundis, casuals, and contractors to see the true cost of your project
                </Text>
                <TouchableOpacity style={[s.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/payment/new" as any)}>
                  <Feather name="plus" size={16} color="#fff" />
                  <Text style={s.emptyBtnText}>Log Payment</Text>
                </TouchableOpacity>
              </View>
            ) : (
              payments.map((p) => (
                <PaymentCard key={p.id} payment={p} colors={colors} onDelete={handleDeletePayment} />
              ))
            )}
          </>
        )}
      </ScrollView>

      <PhotoViewer
        uri={viewerPhoto?.uri ?? null}
        timestamp={viewerPhoto?.report.date}
        notes={viewerPhoto?.report.workDone}
        materialName={`Site Report · ${viewerPhoto?.report.workers ?? 0} workers`}
        onClose={() => setViewerPhoto(null)}
      />
    </View>
  );
}

const rc = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flexDirection: "row", gap: 10, alignItems: "center" },
  dateIcon: { width: 32, height: 32, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  dateText: { fontSize: 14, fontFamily: "Manrope_700Bold" },
  stageText: { fontSize: 12, fontFamily: "Manrope_400Regular" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  workerBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  workerCount: { fontSize: 13, fontFamily: "Manrope_700Bold" },
  deleteBtn: { padding: 4 },
  workDone: { fontSize: 14, fontFamily: "Manrope_500Medium", lineHeight: 21 },
  incidentCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 9, borderWidth: 1, padding: 9 },
  incidentText: { flex: 1, fontSize: 13, fontFamily: "Manrope_500Medium", lineHeight: 18 },
  photoThumb: { borderRadius: 10, overflow: "hidden", height: 100, position: "relative" },
  thumbImg: { width: "100%", height: "100%" },
  photoOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.55)", flexDirection: "row", alignItems: "center", gap: 6, padding: 8 },
  photoLabel: { color: "#fff", fontSize: 12, fontFamily: "Manrope_600SemiBold" },
});

const pc = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 8, gap: 12 },
  typeIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  info: { flex: 1 },
  infoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 },
  recipient: { fontSize: 15, fontFamily: "Manrope_700Bold", flex: 1, marginRight: 8 },
  amount: { fontSize: 15, fontFamily: "Manrope_800ExtraBold" },
  infoBottom: { flexDirection: "row", alignItems: "center", gap: 10 },
  typePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typeText: { fontSize: 11, fontFamily: "Manrope_600SemiBold" },
  date: { fontSize: 12, fontFamily: "Manrope_400Regular" },
  desc: { fontSize: 12, fontFamily: "Manrope_400Regular", marginTop: 3 },
  deleteBtn: { padding: 4 },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontFamily: "Manrope_800ExtraBold" },
  headerSub: { fontSize: 13, fontFamily: "Manrope_400Regular", marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  tabs: { flexDirection: "row", paddingHorizontal: 20, borderBottomWidth: 1 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 12, paddingHorizontal: 4, marginRight: 24, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontSize: 14, fontFamily: "Manrope_600SemiBold" },
  list: { padding: 16 },
  empty: { alignItems: "center", gap: 14, paddingTop: 48, paddingHorizontal: 32 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "Manrope_700Bold" },
  emptyBody: { fontSize: 14, fontFamily: "Manrope_400Regular", textAlign: "center", lineHeight: 21 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { color: "#fff", fontSize: 15, fontFamily: "Manrope_700Bold" },
  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14, gap: 10 },
  summaryTitle: { fontSize: 14, fontFamily: "Manrope_700Bold" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  summaryItem: { gap: 2 },
  summaryValue: { fontSize: 18, fontFamily: "Manrope_800ExtraBold" },
  summaryLabel: { fontSize: 12, fontFamily: "Manrope_400Regular" },
});
