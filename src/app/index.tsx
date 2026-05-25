import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { hasProject, isLoading: appLoading } = useApp();
  const colors = useColors();

  useEffect(() => {
    if (authLoading || appLoading) return;
    if (!user) {
      router.replace("/auth/phone");
    } else if (!hasProject) {
      router.replace("/onboarding");
    } else {
      router.replace("/(tabs)");
    }
  }, [user, hasProject, authLoading, appLoading]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
