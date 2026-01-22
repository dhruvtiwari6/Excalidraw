"use client";

import { NotificationProvider } from "@/app/hooks/useNotifications";

export default function NotificationWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NotificationProvider>{children}</NotificationProvider>;
}
