import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { api, UserPublic } from "@/src/api/client";
import { storage } from "@/src/utils/storage";

type State = {
  user: UserPublic | null;
  token: string | null;
  loading: boolean;
};

type Ctx = State & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    cpf?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  refreshMe: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    phone?: string;
    photo?: string;
  }) => Promise<void>;
};

const SessionContext = createContext<Ctx | null>(null);

type Action =
  | { type: "RESTORE"; user: UserPublic | null; token: string | null }
  | { type: "AUTH"; user: UserPublic; token: string }
  | { type: "LOGOUT" }
  | { type: "USER"; user: UserPublic };

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "RESTORE":
      return { user: a.user, token: a.token, loading: false };
    case "AUTH":
      return { user: a.user, token: a.token, loading: false };
    case "LOGOUT":
      return { user: null, token: null, loading: false };
    case "USER":
      return { ...state, user: a.user };
    default:
      return state;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    (async () => {
      const token = await storage.getItem<string>("auth_token", "");
      if (!token) {
        dispatch({ type: "RESTORE", user: null, token: null });
        return;
      }
      try {
        const me = await api.get<UserPublic>("/auth/me");
        dispatch({ type: "RESTORE", user: me.data, token });
      } catch {
        await storage.removeItem("auth_token");
        dispatch({ type: "RESTORE", user: null, token: null });
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const resp = await api.post("/auth/login", { email, password });
    const { access_token, user } = resp.data;
    await storage.setItem("auth_token", access_token);
    dispatch({ type: "AUTH", user, token: access_token });
  }, []);

  const signUp = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      cpf?: string;
    }) => {
      const resp = await api.post("/auth/register", data);
      const { access_token, user } = resp.data;
      await storage.setItem("auth_token", access_token);
      dispatch({ type: "AUTH", user, token: access_token });
    },
    []
  );

  const signOut = useCallback(async () => {
    await storage.removeItem("auth_token");
    dispatch({ type: "LOGOUT" });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const resp = await api.post("/auth/forgot-password", { email });
    return resp.data.message as string;
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const me = await api.get<UserPublic>("/auth/me");
      dispatch({ type: "USER", user: me.data });
    } catch {
      // ignore
    }
  }, []);

  const updateProfile = useCallback(
    async (data: { name?: string; phone?: string; photo?: string }) => {
      const resp = await api.put<UserPublic>("/auth/me", data);
      dispatch({ type: "USER", user: resp.data });
    },
    []
  );

  const value = useMemo(
    () => ({
      ...state,
      signIn,
      signUp,
      signOut,
      forgotPassword,
      refreshMe,
      updateProfile,
    }),
    [state, signIn, signUp, signOut, forgotPassword, refreshMe, updateProfile]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be inside SessionProvider");
  return ctx;
}
