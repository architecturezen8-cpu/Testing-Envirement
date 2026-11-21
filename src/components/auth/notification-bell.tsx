"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/components/auth/user-provider";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { user, notifications, unreadCount, refresh } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-wine px-1 text-[9px] font-semibold text-paper">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
              <h3 className="font-serif text-base text-ink">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] uppercase tracking-wide-2 text-bronze hover:text-ink"
                >
                  <Check className="h-3 w-3" />
                  Mark read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-stone-500">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-3 border-b border-ink/8 px-4 py-3 last:border-0",
                      !n.read && "bg-bronze/5"
                    )}
                  >
                    <div className="mt-0.5">
                      <StatusDot status={n.status} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-ink">{n.title}</p>
                        {!n.read && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-bronze" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                        {n.body}
                      </p>
                      {n.orderNumber && (
                        <p className="mt-1 text-[10px] uppercase tracking-wide-2 text-stone-400">
                          Order {n.orderNumber}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusDot({ status }: { status: string | null }) {
  const colors: Record<string, string> = {
    pending: "bg-stone-400",
    processing: "bg-amber-500",
    shipped: "bg-blue-500",
    delivered: "bg-green-500",
    cancelled: "bg-red-500",
  };
  return (
    <span
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full bg-cream text-bronze",
        status && colors[status]
      )}
    >
      <Bell className="h-3.5 w-3.5 text-paper" />
    </span>
  );
}
