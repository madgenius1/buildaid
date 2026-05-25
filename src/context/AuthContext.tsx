import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";

export interface User {
  phone: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  pendingPhone: string;
  signIn: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("bg_user")
      .then((data) => {
        if (data) setUser(JSON.parse(data));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (phone: string) => {
    setPendingPhone(phone);
  }, []);

  const verifyOtp = useCallback(
    async (otp: string): Promise<boolean> => {
      if (otp.length >= 4 && otp.length <= 6 && /^\d+$/.test(otp)) {
        const newUser: User = { phone: pendingPhone };
        await AsyncStorage.setItem("bg_user", JSON.stringify(newUser));
        setUser(newUser);
        return true;
      }
      return false;
    },
    [pendingPhone]
  );

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove([
      "bg_user",
      "bg_project",
      "bg_materials",
      "bg_transactions",
    ]);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, pendingPhone, signIn, verifyOtp, signOut }),
    [user, isLoading, pendingPhone, signIn, verifyOtp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
