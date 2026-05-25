import { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

function fmtStamp(iso: string): string {
  return new Date(iso).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface PhotoCaptureProps {
  photoUri: string | null;
  timestamp: string;
  label?: string;
  onCapture: (uri: string) => void;
  onRemove: () => void;
}

export function PhotoCapture({
  photoUri,
  timestamp,
  label = "Capture Receipt",
  onCapture,
  onRemove,
}: PhotoCaptureProps) {
  const colors = useColors();
  const [loading, setLoading] = useState(false);

  const launchCamera = async () => {
    if (Platform.OS === "web") {
      await launchLibrary();
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Access",
        "Please allow camera access in your device settings to take photos."
      );
      return;
    }
    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });
      if (!result.canceled) onCapture(result.assets[0].uri);
    } finally {
      setLoading(false);
    }
  };

  const launchLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Photo Library",
        "Please allow photo library access in your device settings."
      );
      return;
    }
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });
      if (!result.canceled) onCapture(result.assets[0].uri);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    if (photoUri) {
      Alert.alert("Receipt Photo", "What would you like to do?", [
        {
          text: Platform.OS === "web" ? "Replace (Library)" : "Retake Photo",
          onPress: launchCamera,
        },
        ...(Platform.OS !== "web"
          ? [{ text: "Choose from Library", onPress: launchLibrary }]
          : []),
        { text: "Remove", style: "destructive" as const, onPress: onRemove },
        { text: "Cancel", style: "cancel" as const },
      ]);
      return;
    }

    if (Platform.OS === "web") {
      launchLibrary();
      return;
    }

    Alert.alert("Add Receipt Photo", "Choose source", [
      { text: "Take Photo", onPress: launchCamera },
      { text: "Choose from Library", onPress: launchLibrary },
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  if (loading) {
    return (
      <View
        style={[
          s.loadingBox,
          { backgroundColor: colors.secondary, borderColor: colors.border },
        ]}
      >
        <ActivityIndicator color={colors.primary} />
        <Text style={[s.loadingText, { color: colors.mutedForeground }]}>
          Loading…
        </Text>
      </View>
    );
  }

  if (photoUri) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={s.previewWrapper}
        activeOpacity={0.9}
      >
        <Image source={{ uri: photoUri }} style={s.previewImage} resizeMode="cover" />
        {/* Timestamp overlay */}
        <View style={s.stampOverlay}>
          <Feather name="clock" size={10} color="#fff" />
          <Text style={s.stampText}>{fmtStamp(timestamp)}</Text>
        </View>
        {/* Edit button */}
        <View style={[s.editBadge, { backgroundColor: colors.primary }]}>
          <Feather name="edit-2" size={12} color="#fff" />
          <Text style={s.editBadgeText}>Change</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        s.captureBtn,
        { backgroundColor: colors.secondary, borderColor: colors.border },
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <View style={[s.cameraIcon, { backgroundColor: colors.primary + "18" }]}>
        <Feather name="camera" size={22} color={colors.primary} />
      </View>
      <View style={s.captureMeta}>
        <Text style={[s.captureTitle, { color: colors.foreground }]}>
          {label}
        </Text>
        <Text style={[s.captureSub, { color: colors.mutedForeground }]}>
          Auto-stamped · {fmtStamp(timestamp)}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  loadingBox: {
    height: 72,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { fontSize: 14, fontFamily: "Manrope_500Medium" },
  previewWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    height: 180,
    position: "relative",
  },
  previewImage: { width: "100%", height: "100%" },
  stampOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  stampText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Manrope_500Medium",
  },
  editBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  editBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Manrope_600SemiBold",
  },
  captureBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  cameraIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  captureMeta: { flex: 1 },
  captureTitle: { fontSize: 15, fontFamily: "Manrope_700Bold" },
  captureSub: {
    fontSize: 12,
    fontFamily: "Manrope_400Regular",
    marginTop: 2,
  },
});
