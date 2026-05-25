import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

const QUICK_MAP: Record<string, number[]> = {
  bags: [5, 10, 20, 50, 100],
  kg: [25, 50, 100, 200, 500],
  "m³": [0.5, 1, 2, 5, 10],
};

function getAmounts(unit: string): number[] {
  return QUICK_MAP[unit] ?? [1, 5, 10, 25, 50];
}

interface QuickAmountsProps {
  unit: string;
  current: string;
  onSelect: (val: string) => void;
}

export function QuickAmounts({ unit, current, onSelect }: QuickAmountsProps) {
  const colors = useColors();
  const amounts = getAmounts(unit);

  const handleTap = (val: number) => {
    const existing = parseFloat(current) || 0;
    onSelect((existing + val).toString());
  };

  return (
    <View style={s.row}>
      {amounts.map((val) => (
        <TouchableOpacity
          key={val}
          style={[
            s.chip,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
          onPress={() => handleTap(val)}
          activeOpacity={0.7}
        >
          <Text style={[s.chipText, { color: colors.foreground }]}>
            +{val}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "Manrope_600SemiBold",
  },
});
