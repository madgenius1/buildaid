import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function OtpScreen() {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);
  const router = useRouter();
  const { verifyOtp, pendingPhone, signIn } = useAuth();
  const { hasProject } = useApp();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (verifyingRef.current) return;
      verifyingRef.current = true;
      setIsVerifying(true);
      setError("");
      try {
        const ok = await verifyOtp(code);
        if (ok) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          router.replace(hasProject ? "/(tabs)" : "/onboarding");
        } else {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          setError("Invalid code. Try again.");
          setDigits(["", "", "", "", "", ""]);
          setTimeout(() => inputs.current[0]?.focus(), 100);
        }
      } finally {
        setIsVerifying(false);
        verifyingRef.current = false;
      }
    },
    [verifyOtp, hasProject, router]
  );

  const handleChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[idx] = val;
    setDigits(newDigits);
    setError("");

    if (val && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }

    const code = newDigits.join("");
    if (code.length === 6 && !newDigits.includes("")) {
      handleVerify(code);
    }
  };

  const handleKeyPress = (key: string, idx: number) => {
    if (key === "Backspace" && !digits[idx] && idx > 0) {
      const newDigits = [...digits];
      newDigits[idx - 1] = "";
      setDigits(newDigits);
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    await signIn(pendingPhone);
    setCountdown(60);
    setCanResend(false);
    setDigits(["", "", "", "", "", ""]);
    setTimeout(() => inputs.current[0]?.focus(), 100);
  };

  const maskedPhone =
    pendingPhone.length > 4
      ? `+${pendingPhone.slice(0, 3)} ${"*".repeat(pendingPhone.length - 6)}${pendingPhone.slice(-3)}`
      : pendingPhone;

  const s = styles(colors, insets);

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={s.container}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={[s.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        <Text style={[s.title, { color: colors.foreground }]}>
          Enter OTP Code
        </Text>
        <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
          Sent to {maskedPhone}
        </Text>

        <View style={s.boxRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => {
                inputs.current[i] = r;
              }}
              style={[
                s.box,
                {
                  backgroundColor: colors.card,
                  borderColor: d ? colors.primary : colors.border,
                  color: colors.foreground,
                },
              ]}
              value={d}
              onChangeText={(v) => handleChange(v, i)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, i)
              }
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={i === 0}
              textAlign="center"
              editable={!isVerifying}
            />
          ))}
        </View>

        {error ? (
          <Text style={[s.errorText, { color: colors.destructive }]}>
            {error}
          </Text>
        ) : null}

        {isVerifying ? (
          <View style={s.verifyingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[s.verifyingText, { color: colors.mutedForeground }]}>
              Verifying…
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={handleResend}
          disabled={!canResend}
          style={s.resendBtn}
        >
          <Text
            style={[
              s.resendText,
              { color: canResend ? colors.primary : colors.mutedForeground },
            ]}
          >
            {canResend ? "Resend OTP" : `Resend in ${countdown}s`}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function styles(colors: ReturnType<typeof import("@/hooks/useColors").useColors>, insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    root: { flex: 1 },
    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: Math.max(insets.top + 40, 60),
      paddingBottom: insets.bottom + 32,
    },
    backBtn: { marginBottom: 32 },
    backText: {
      fontSize: 16,
      fontFamily: "Manrope_500Medium",
    },
    title: {
      fontSize: 28,
      fontWeight: "700" as const,
      fontFamily: "Manrope_700Bold",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      fontFamily: "Manrope_400Regular",
      marginBottom: 40,
    },
    boxRow: {
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      marginBottom: 24,
    },
    box: {
      width: 48,
      height: 58,
      borderWidth: 2,
      borderRadius: 10,
      fontSize: 24,
      fontWeight: "700" as const,
      fontFamily: "Manrope_700Bold",
    },
    errorText: {
      fontSize: 14,
      textAlign: "center",
      fontFamily: "Manrope_400Regular",
      marginBottom: 16,
    },
    verifyingRow: {
      flexDirection: "row",
      gap: 10,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    verifyingText: {
      fontSize: 14,
      fontFamily: "Manrope_400Regular",
    },
    resendBtn: { alignItems: "center", marginTop: 8 },
    resendText: {
      fontSize: 15,
      fontFamily: "Manrope_500Medium",
    },
  });
}
