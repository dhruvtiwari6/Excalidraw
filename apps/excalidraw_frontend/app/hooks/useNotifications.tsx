"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Socket } from "socket.io-client";

interface JoinRequest {
  id: string; // roomId-userId combination for uniqueness
  roomId: number;
  userId: number;
  timestamp: number;
}

interface NotificationContextType {
  requests: JoinRequest[];
  addRequest: (request: Omit<JoinRequest, "timestamp" | "id">) => void;
  removeRequest: (id: string) => void;
  setupSocketListeners: (socket: Socket | null) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const addRequest = (request: Omit<JoinRequest, "timestamp" | "id">) => {
    const id = `${request.roomId}-${request.userId}`;
    setRequests((prev) => {
      // Avoid duplicates
      if (prev.some((r) => r.id === id)) return prev;
      return [...prev, { ...request, id, timestamp: Date.now() }];
    });
  };

  const removeRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const setupSocketListeners = (newSocket: Socket | null) => {
    // Clean up old socket listeners
    if (socket) {
      socket.off("room:join:request");
    }

    if (newSocket) {
      newSocket.on("room:join:request", (data: { roomId: number; userId: number }) => {
        addRequest(data);
      });
      setSocket(newSocket);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ requests, addRequest, removeRequest, setupSocketListeners }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
