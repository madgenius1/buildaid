import { ExportButton } from "@/components/ExportButton";
import { PhotoViewer } from "@/components/PhotoViewer";
import { Transaction, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
    Platform,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function groupByDay(
  transactions: Transaction[],
): { title: string; data: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const d = new Date(t.date);
    const diff = Math.floor(
      (new Date().setHours(0, 0, 0, 0) -
        new Date(t.date).setHours(0, 0, 0, 0)) /
        86400000,
    );
    const label =
      diff === 0
        ? "Today"
        : diff === 1
          ? "Yesterday"
          : d.toLocaleDateString("en-KE", {
              weekday: "long",
              day: "numeric",
              month: "short",
            });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(t);
  }
  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

const TYPE_CONFIG = {
  purchase: {
    icon: "shopping-cart" as const,
    label: "Purchased",
    color: "#3B82F6",
  },
  delivery: { icon: "truck" as const, label: "Delivered", color: "#8B5CF6" },
  usage: { icon: "tool" as const, label: "Used", color: "#F59E0B" },
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtKsh(n?: number) {
  if (!n) return "";
  if (n >= 1_000_000) return `KSh ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KSh ${(n / 1_000).toFixed(0)}K`;
  return `KSh ${n}`;
}

function TxRow({
  item,
  colors,
  onPhotoPress,
}: {
  item: Transaction;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  onPhotoPress: (tx: Transaction) => void;
}) {
  const cfg = TYPE_CONFIG[item.type];
  return (
    <View
      style={[
        s.row,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
      ]}
    >
      <View style={[s.iconBox, { backgroundColor: cfg.color + "18" }]}>
        <Feather name={cfg.icon} size={15} color={cfg.color} />
      </View>
      <View style={s.rowContent}>
        <View style={s.rowTop}>
          <Text style={[s.rowMat, { color: colors.foreground }]}>
            {item.materialName}
          </Text>
          <Text style={[s.rowTime, { color: colors.mutedForeground }]}>
            {fmtTime(item.date)}
          </Text>
        </View>
        <View style={s.rowMid}>
          <View style={[s.typePill, { backgroundColor: cfg.color + "18" }]}>
            <Text style={[s.typeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={[s.rowQty, { color: colors.foreground }]}>
            {item.quantity}
            {item.cost ? ` · ${fmtKsh(item.cost)}` : ""}
          </Text>
        </View>
        {item.notes ? (
          <Text
            style={[s.rowNotes, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {item.notes}
          </Text>
        ) : null}
        {item.stage ? (
          <Text style={[s.rowStage, { color: colors.mutedForeground }]}>
            Stage: {item.stage}
          </Text>
        ) : null}
      </View>
      {item.photoUri ? (
        <TouchableOpacity
          onPress={() => onPhotoPress(item)}
          style={[s.photoBtn, { backgroundColor: "#8B5CF618" }]}
        >
          <Feather name="camera" size={14} color="#8B5CF6" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function HistoryScreen() {
  const { transactions } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 + 84 : insets.bottom + 84;
  const [viewerTx, setViewerTx] = useState<Transaction | null>(null);

  const sections = groupByDay(transactions);
  const photoCount = transactions.filter((t) => t.photoUri).length;

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
          <Text style={[s.headerTitle, { color: colors.foreground }]}>
            Activity
          </Text>
          <View style={s.headerMeta}>
            <Text style={[s.headerSub, { color: colors.mutedForeground }]}>
              {transactions.length} entries
            </Text>
            {photoCount > 0 ? (
              <View style={[s.photoBadge, { backgroundColor: "#8B5CF618" }]}>
                <Feather name="camera" size={12} color="#8B5CF6" />
                <Text style={[s.photoBadgeText, { color: "#8B5CF6" }]}>
                  {photoCount} receipt{photoCount > 1 ? "s" : ""}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        {transactions.length > 0 ? <ExportButton /> : null}
      </View>

      {transactions.length === 0 ? (
        <View style={s.empty}>
          <View style={[s.emptyIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="clock" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>
            No activity yet
          </Text>
          <Text style={[s.emptyBody, { color: colors.mutedForeground }]}>
            Log a purchase, delivery, or usage from the Home tab to get started
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TxRow
              item={item}
              colors={colors}
              onPhotoPress={(tx) => setViewerTx(tx)}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View
              style={[s.sectionHeader, { backgroundColor: colors.background }]}
            >
              <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>
                {title}
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: bottomPad }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
        />
      )}

      <PhotoViewer
        uri={viewerTx?.photoUri ?? null}
        timestamp={viewerTx?.date}
        notes={viewerTx?.notes}
        materialName={viewerTx?.materialName}
        quantity={viewerTx?.quantity}
        onClose={() => setViewerTx(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontFamily: "Manrope_800ExtraBold" },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  headerSub: { fontSize: 13, fontFamily: "Manrope_400Regular" },
  photoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  photoBadgeText: { fontSize: 12, fontFamily: "Manrope_600SemiBold" },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Manrope_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Manrope_700Bold" },
  emptyBody: {
    fontSize: 14,
    fontFamily: "Manrope_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rowContent: { flex: 1 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  rowMat: { fontSize: 15, fontFamily: "Manrope_700Bold" },
  rowTime: { fontSize: 12, fontFamily: "Manrope_400Regular" },
  rowMid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  typeText: { fontSize: 11, fontFamily: "Manrope_600SemiBold" },
  rowQty: { fontSize: 14, fontFamily: "Manrope_600SemiBold" },
  rowNotes: { fontSize: 12, fontFamily: "Manrope_400Regular", marginTop: 3 },
  rowStage: { fontSize: 11, fontFamily: "Manrope_400Regular", marginTop: 1 },
  photoBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
