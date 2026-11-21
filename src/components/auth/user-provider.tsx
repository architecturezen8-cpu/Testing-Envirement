"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type User = { id: number; email: string; name: string };

type Notification = {
  id: number;
  orderId: number | null;
  orderNumber: string | null;
  title: string;
  body: string;
  status: string | null;
  read: boolean;
  createdAt: string | null;
};

type UserContextValue = {
  user: User | null;
  loading: boolean;
  notifications: Notification[];
  unreadCount: number;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [meRes, notifRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/notifications"),
      ]);
      const meData = await meRes.json();
      setUser(meData.user ?? null);
      if (meData.user) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications ?? []);
      } else {
        setNotifications([]);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setNotifications([]);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <UserContext.Provider
      value={{ user, loading, notifications, unreadCount, refresh, logout }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
