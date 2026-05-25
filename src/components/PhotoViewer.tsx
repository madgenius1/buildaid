import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

interface PhotoViewerProps {
  uri: string | null;
  timestamp?: string;
  notes?: string;
  materialName?: string;
  quantity?: number;
  unit?: string;
  onClose: () => void;
}

function fmtStamp(iso: string): string {
  return new Date(iso).toLocaleString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const { width: SCREEN_W } = Dimensions.get("window");

export function PhotoViewer({
  uri,
  timestamp,
  notes,
  materialName,
  quantity,
  unit,
  onClose,
}: PhotoViewerProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={!!uri}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.overlay}>
        {/* Close */}
        <TouchableOpacity
          style={[s.closeBtn, { top: insets.top + 12 }]}
          onPress={onClose}
        >
          <Feather name="x" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Title bar */}
        {materialName ? (
          <View style={[s.titleBar, { top: insets.top + 12 }]}>
            <Text style={s.titleBarText}>
              {materialName}
              {quantity ? ` · ${quantity} ${unit ?? ""}` : ""}
            </Text>
          </View>
        ) : null}

        {/* Image */}
        {uri ? (
          <Image
            source={{ uri }}
            style={s.image}
            resizeMode="contain"
          />
        ) : null}

        {/* Info footer */}
        <View
          style={[
            s.footer,
            { paddingBottom: Math.max(insets.bottom + 16, 24) },
          ]}
        >
          {timestamp ? (
            <View style={s.footerRow}>
              <Feather name="clock" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={s.footerTimestamp}>{fmtStamp(timestamp)}</Text>
            </View>
          ) : null}
          {notes ? (
            <View style={s.footerRow}>
              <Feather
                name="file-text"
                size={14}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={s.footerNotes}>{notes}</Text>
            </View>
          ) : null}
          <Text style={s.footerHint}>Receipt / Delivery record</Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  titleBar: {
    position: "absolute",
    right: 16,
    left: 64,
    zIndex: 10,
    alignItems: "center",
  },
  titleBarText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    fontFamily: "Manrope_700Bold",
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_W * 1.3,
    maxHeight: "70%",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  footerTimestamp: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontFamily: "Manrope_500Medium",
    flex: 1,
  },
  footerNotes: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
    flex: 1,
    lineHeight: 19,
  },
  footerHint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontFamily: "Manrope_400Regular",
    marginTop: 4,
  },
});
