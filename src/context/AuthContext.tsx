import { createContext, useContext, useState, type ReactNode } from "react";
import { getToken, setToken, clearToken, type SellerAuthResponse } from "../api/sellerApi";

interface AuthState {
  token: string | null;
  seller: SellerAuthResponse | null;
  login: (res: SellerAuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken);
  const [seller, setSeller] = useState<SellerAuthResponse | null>(() => {
    try {
      const s = localStorage.getItem("seller_info");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const login = (res: SellerAuthResponse) => {
    setToken(res.token);
    setTokenState(res.token);
    setSeller(res);
    localStorage.setItem("seller_info", JSON.stringify(res));
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setSeller(null);
    localStorage.removeItem("seller_info");
  };

  return (
    <AuthContext.Provider value={{ token, seller, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
