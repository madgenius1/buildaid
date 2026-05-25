import { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function fmtKsh(n?: number): string {
  if (!n) return "";
  if (n >= 1_000_000) return `KSh ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `KSh ${(n / 1_000).toFixed(2)}K`;
  return `KSh ${n.toFixed(2)}`;
}

function buildCSV(
  project: ReturnType<typeof useApp>["project"],
  materials: ReturnType<typeof useApp>["materials"],
  transactions: ReturnType<typeof useApp>["transactions"],
  totalSpent: number
): string {
  if (!project) return "";

  const esc = (v: string) => `"${v.replace(/"/g, '""').replace(/\n/g, " ").replace(/,/g, ";")}"`;

  // Summary block
  const summaryRows = [
    ["Project", project.name],
    ["Budget (KSh)", project.budget.toString()],
    ["Total Spent (KSh)", totalSpent.toString()],
    ["Remaining (KSh)", (project.budget - totalSpent).toString()],
    ["Area (m²)", project.area.toString()],
    ["Current Stage", project.stage],
    ["Build Type", project.buildType],
    ["Floors", project.floors.toString()],
    ["Export Date", new Date().toLocaleString("en-KE")],
    [],
  ];

  // Materials summary block
  const matHeaders = ["Material", "Unit", "Purchased", "Delivered", "Used", "Remaining", "Total Cost (KSh)"];
  const matRows = materials.map((m) => [
    esc(m.name),
    esc(m.unit),
    m.purchased.toString(),
    m.delivered.toString(),
    m.used.toString(),
    (m.purchased - m.used).toString(),
    m.totalCost.toString(),
  ]);

  // Transactions block
  const txHeaders = [
    "Date",
    "Time",
    "Stage",
    "Type",
    "Material",
    "Quantity",
    "Unit",
    "Cost (KSh)",
    "Notes",
    "Has Photo",
  ];

  const txRows = transactions.map((tx) => {
    const mat = materials.find((m) => m.id === tx.materialId);
    const d = new Date(tx.date);
    return [
      esc(d.toLocaleDateString("en-KE")),
      esc(d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })),
      esc(tx.stage ?? project.stage),
      esc(tx.type.charAt(0).toUpperCase() + tx.type.slice(1)),
      esc(tx.materialName),
      tx.quantity.toString(),
      esc(mat?.unit ?? ""),
      (tx.cost ?? "").toString(),
      esc(tx.notes ?? ""),
      tx.photoUri ? "Yes" : "No",
    ];
  });

  const lines: string[] = [];

  lines.push(`BuildGuard Report - ${project.name}`);
  lines.push("");
  lines.push("PROJECT SUMMARY");
  summaryRows.forEach((row) => {
    if (row.length === 0) lines.push("");
    else lines.push(row.map((v) => esc(v)).join(","));
  });

  lines.push("MATERIALS SUMMARY");
  lines.push(matHeaders.map(esc).join(","));
  matRows.forEach((r) => lines.push(r.join(",")));
  lines.push("");

  lines.push("TRANSACTION LOG");
  lines.push(txHeaders.map(esc).join(","));
  txRows.forEach((r) => lines.push(r.join(",")));

  return lines.join("\n");
}

export function ExportButton({ minimal = false }: { minimal?: boolean }) {
  const { project, materials, transactions, totalSpent } = useApp();
  const colors = useColors();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!project) return;
    if (transactions.length === 0) {
      Alert.alert("Nothing to export", "Log some purchases, deliveries, or usage first.");
      return;
    }

    setExporting(true);
    try {
      const csv = buildCSV(project, materials, transactions, totalSpent);
      const filename = `BuildGuard_${project.name.replace(/\s+/g, "_")}_${Date.now()}.csv`;

      if (Platform.OS === "web") {
        // Web: trigger download
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Native: write file and share
        const fileUri = (FileSystem.cacheDirectory ?? "") + filename;
        await FileSystem.writeAsStringAsync(fileUri, csv, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "text/csv",
            dialogTitle: `Export: ${project.name}`,
            UTI: "public.comma-separated-values-text",
          });
        } else {
          Alert.alert("Sharing not available", `Report saved to: ${fileUri}`);
        }
      }
    } catch (err) {
      Alert.alert("Export failed", "Something went wrong. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (minimal) {
    return (
      <TouchableOpacity
        onPress={handleExport}
        disabled={exporting}
        style={[ms.iconBtn, { backgroundColor: colors.secondary }]}
      >
        {exporting ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Feather name="download" size={17} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        ms.btn,
        {
          backgroundColor: colors.secondary,
          borderColor: colors.border,
          opacity: exporting ? 0.75 : 1,
        },
      ]}
      onPress={handleExport}
      disabled={exporting}
      activeOpacity={0.8}
    >
      {exporting ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Feather name="download" size={16} color={colors.primary} />
      )}
      <Text style={[ms.btnText, { color: colors.primary }]}>
        {exporting ? "Exporting…" : "Export CSV"}
      </Text>
    </TouchableOpacity>
  );
}

const ms = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnText: { fontSize: 14, fontFamily: "Manrope_600SemiBold" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
