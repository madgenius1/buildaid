import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { PhotoViewer } from "@/components/PhotoViewer";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatKsh(n?: number) {
  if (!n) return "";
  if (n >= 1_000_000) return `KSh ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KSh ${(n / 1_000).toFixed(0)}K`;
  return `KSh ${n.toFixed(0)}`;
}

const TYPE_COLORS: Record<string, string> = {
  purchase: "#3B82F6",
  delivery: "#8B5CF6",
  usage: "#F59E0B",
};

const TYPE_ICONS: Record<string, string> = {
  purchase: "shopping-cart",
  delivery: "truck",
  usage: "tool",
};

export default function MaterialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMaterial, getMaterialTransactions, alerts } = useApp();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [viewerPhoto, setViewerPhoto] = useState<{
    uri: string;
    timestamp: string;
    notes?: string;
    quantity?: number;
  } | null>(null);

  const mat = getMaterial(id ?? "");
  const txs = getMaterialTransactions(id ?? "");
  const matAlerts = alerts.filter((a) => a.materialId === id);
  const deliveryPhotos = txs.filter((t) => t.type === "delivery" && t.photoUri);

  if (!mat) return null;

  const remaining = mat.purchased - mat.used;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
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
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>
          {mat.name}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Stats card */}
        <View style={[s.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.statsGrid}>
            {[
              { label: "Purchased", value: mat.purchased },
              { label: "Delivered", value: mat.delivered },
              { label: "Used", value: mat.used },
              { label: "Remaining", value: remaining, highlight: remaining < 0 },
            ].map((item) => (
              <View key={item.label} style={s.statItem}>
                <Text
                  style={[
                    s.statValue,
                    { color: item.highlight ? colors.destructive : colors.foreground },
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
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <View style={s.costRow}>
            <Text style={[s.costLabel, { color: colors.mutedForeground }]}>
              Total material cost
            </Text>
            <Text style={[s.costValue, { color: colors.foreground }]}>
              {formatKsh(mat.totalCost) || "—"}
            </Text>
          </View>
          {mat.purchased > 0 && mat.totalCost > 0 ? (
            <View style={s.costRow}>
              <Text style={[s.costLabel, { color: colors.mutedForeground }]}>
                Cost per {mat.unit}
              </Text>
              <Text style={[s.costValue, { color: colors.foreground }]}>
                {formatKsh(mat.totalCost / mat.purchased)}
              </Text>
            </View>
          ) : null}
          <Text style={[s.unitNote, { color: colors.mutedForeground }]}>
            All quantities in {mat.unit}
          </Text>
        </View>

        {/* Alerts */}
        {matAlerts.length > 0 ? (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>Alerts</Text>
            {matAlerts.map((alert) => (
              <View
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
              >
                <Feather
                  name={alert.severity === "critical" ? "alert-circle" : "alert-triangle"}
                  size={16}
                  color={
                    alert.severity === "critical" ? colors.destructive : colors.warning
                  }
                />
                <Text style={[s.alertMsg, { color: colors.foreground }]}>
                  {alert.message}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Delivery receipts */}
        {deliveryPhotos.length > 0 ? (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>
              Delivery Receipts
            </Text>
            <Text style={[s.sectionSub, { color: colors.mutedForeground }]}>
              {deliveryPhotos.length} photo{deliveryPhotos.length > 1 ? "s" : ""} — tap to view
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.photoRow}>
                {deliveryPhotos.map((tx) => (
                  <TouchableOpacity
                    key={tx.id}
                    style={s.photoThumb}
                    onPress={() =>
                      setViewerPhoto({
                        uri: tx.photoUri!,
                        timestamp: tx.date,
                        notes: tx.notes,
                        quantity: tx.quantity,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: tx.photoUri }}
                      style={s.thumbImage}
                      resizeMode="cover"
                    />
                    <View style={[s.thumbStamp, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
                      <Text style={s.thumbDate}>{formatDate(tx.date)}</Text>
                      <Text style={s.thumbQty}>
                        {tx.quantity} {mat.unit}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : null}

        {/* Transaction history */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>
            Transaction History
          </Text>
          {txs.length === 0 ? (
            <Text style={[s.emptyTx, { color: colors.mutedForeground }]}>
              No transactions yet
            </Text>
          ) : (
            txs.map((tx) => (
              <View
                key={tx.id}
                style={[
                  s.txRow,
                  { backgroundColor: colors.card, borderBottomColor: colors.border },
                ]}
              >
                <View
                  style={[
                    s.txDot,
                    { backgroundColor: TYPE_COLORS[tx.type] + "20" },
                  ]}
                >
                  <Feather
                    name={TYPE_ICONS[tx.type] as any}
                    size={14}
                    color={TYPE_COLORS[tx.type]}
                  />
                </View>
                <View style={s.txInfo}>
                  <View style={s.txTopRow}>
                    <Text style={[s.txType, { color: colors.foreground }]}>
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </Text>
                    <Text style={[s.txDate, { color: colors.mutedForeground }]}>
                      {formatDate(tx.date)} · {formatTime(tx.date)}
                    </Text>
                  </View>
                  <Text style={[s.txQty, { color: colors.foreground }]}>
                    {tx.quantity} {mat.unit}
                    {tx.cost ? ` · ${formatKsh(tx.cost)}` : ""}
                  </Text>
                  {tx.notes ? (
                    <Text
                      style={[s.txNotes, { color: colors.mutedForeground }]}
                      numberOfLines={2}
                    >
                      {tx.notes}
                    </Text>
                  ) : null}
                </View>
                {tx.photoUri ? (
                  <TouchableOpacity
                    onPress={() =>
                      setViewerPhoto({
                        uri: tx.photoUri!,
                        timestamp: tx.date,
                        notes: tx.notes,
                        quantity: tx.quantity,
                      })
                    }
                    style={s.txPhoto}
                  >
                    <Image
                      source={{ uri: tx.photoUri }}
                      style={s.txPhotoThumb}
                      resizeMode="cover"
                    />
                    <View style={s.txPhotoBadge}>
                      <Feather name="camera" size={10} color="#fff" />
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Full-screen photo viewer */}
      <PhotoViewer
        uri={viewerPhoto?.uri ?? null}
        timestamp={viewerPhoto?.timestamp}
        notes={viewerPhoto?.notes}
        materialName={mat.name}
        quantity={viewerPhoto?.quantity}
        unit={mat.unit}
        onClose={() => setViewerPhoto(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontFamily: "Manrope_800ExtraBold" },
  content: { padding: 16, gap: 0 },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 0,
  },
  statsGrid: { flexDirection: "row", marginBottom: 16 },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 24, fontFamily: "Manrope_800ExtraBold" },
  statLabel: { fontSize: 12, fontFamily: "Manrope_400Regular" },
  divider: { height: 1, marginBottom: 12 },
  costRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  costLabel: { fontSize: 14, fontFamily: "Manrope_400Regular" },
  costValue: { fontSize: 15, fontFamily: "Manrope_700Bold" },
  unitNote: { fontSize: 11, fontFamily: "Manrope_400Regular", marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontFamily: "Manrope_800ExtraBold", marginBottom: 4 },
  sectionSub: { fontSize: 12, fontFamily: "Manrope_400Regular", marginBottom: 10 },
  alertCard: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  alertMsg: { flex: 1, fontSize: 14, fontFamily: "Manrope_500Medium", lineHeight: 20 },
  photoRow: { flexDirection: "row", gap: 10, paddingBottom: 4 },
  photoThumb: {
    width: 140,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  thumbImage: { width: "100%", height: "100%" },
  thumbStamp: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 7,
  },
  thumbDate: { color: "#fff", fontSize: 11, fontFamily: "Manrope_600SemiBold" },
  thumbQty: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: "Manrope_400Regular" },
  emptyTx: { fontSize: 14, fontFamily: "Manrope_400Regular", textAlign: "center", paddingVertical: 20 },
  txRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  txDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  txInfo: { flex: 1 },
  txTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  txType: { fontSize: 14, fontFamily: "Manrope_700Bold" },
  txDate: { fontSize: 11, fontFamily: "Manrope_400Regular" },
  txQty: { fontSize: 14, fontFamily: "Manrope_500Medium" },
  txNotes: { fontSize: 12, fontFamily: "Manrope_400Regular", marginTop: 3, lineHeight: 17 },
  txPhoto: { position: "relative", flexShrink: 0 },
  txPhotoThumb: { width: 52, height: 52, borderRadius: 8 },
  txPhotoBadge: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
});
