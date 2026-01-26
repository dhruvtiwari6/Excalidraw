"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface JoinRequest {
  id: string; // roomId-userId combination
  roomId: number;
  userId: string;  
  name: string;
  timestamp: number;
}

interface User {
  userId: string;
  name: string;
}

interface IncomingRequestData {
  roomId: number;
  users: User[];
}

interface NotificationContextType {
  requests: JoinRequest[];
  addRequest: (request: IncomingRequestData) => void;
  removeRequest: (id: string) => void;
}

const NotificationContext =
  createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);

  const addRequest = (request: IncomingRequestData) => {
    console.log("rew : ", request);

    setRequests((prev) => {
      const existing = new Set(prev.map((r) => r.id));
    
      const next = request.users.map((user) => ({
        id: `${request.roomId}-${user.userId}`,
        roomId: request.roomId,
        userId: user.userId,
        name: user.name,
        timestamp: Date.now(),
      }));
    
      return [
        ...prev,
        ...next.filter((r) => !existing.has(r.id)),
      ];
    });
  };

  const removeRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{ requests, addRequest, removeRequest }}
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
