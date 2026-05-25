import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function PhoneScreen() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { signIn } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleSubmit = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setError("Please enter a valid phone number");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await signIn(digits);
      router.push("/auth/otp");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingTop: Math.max(insets.top + 60, 80), paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={s.logoArea}>
          <View style={[s.logoBox, { backgroundColor: colors.primary }]}>
            <Text style={s.logoLetter}>B</Text>
          </View>
          <Text style={[s.appName, { color: colors.foreground }]}>
            BuildGuard
          </Text>
          <Text style={[s.tagline, { color: colors.mutedForeground }]}>
            Track materials. Detect loss.
          </Text>
        </View>

        <View style={s.form}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>
            PHONE NUMBER
          </Text>
          <TextInput
            style={[
              s.input,
              {
                backgroundColor: colors.card,
                borderColor: error ? colors.destructive : colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="+254 7XX XXX XXX"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              setError("");
            }}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
          {error ? (
            <Text style={[s.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[
              s.btn,
              { backgroundColor: colors.primary, opacity: isLoading ? 0.75 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={s.btnText}>{isLoading ? "Sending…" : "Send OTP"}</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.demoBox, { backgroundColor: colors.secondary }]}>
          <Text style={[s.demoTitle, { color: colors.foreground }]}>
            Demo Mode
          </Text>
          <Text style={[s.demoBody, { color: colors.mutedForeground }]}>
            Enter any phone number, then any 6-digit code to sign in. Use area
            200 m² during setup to see pre-loaded sample data and alerts.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  logoArea: { alignItems: "center", marginBottom: 48 },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoLetter: {
    fontSize: 38,
    fontFamily: "Manrope_800ExtraBold",
    color: "#fff",
  },
  appName: { fontSize: 28, fontFamily: "Manrope_800ExtraBold", marginBottom: 6 },
  tagline: { fontSize: 15, fontFamily: "Manrope_400Regular" },
  form: { gap: 12, marginBottom: 32 },
  label: { fontSize: 11, fontFamily: "Manrope_700Bold", letterSpacing: 0.8 },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 18,
    fontFamily: "Manrope_500Medium",
  },
  errorText: { fontSize: 13, fontFamily: "Manrope_400Regular" },
  btn: {
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  btnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Manrope_700Bold",
  },
  demoBox: {
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  demoTitle: { fontSize: 14, fontFamily: "Manrope_700Bold" },
  demoBody: { fontSize: 13, fontFamily: "Manrope_400Regular", lineHeight: 19 },
});
