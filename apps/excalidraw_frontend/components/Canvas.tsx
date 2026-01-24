
"use client";

import { useSocket } from "@/app/hooks/useSocket";
import { useEffect, useState } from "react";
import CanvasRoom from "./CanvasRoom";
import { Shape } from "@/app/draw";
import axios from "axios";
import { useNotifications } from "@/app/hooks/useNotifications";

type JoinResult = {
  success: boolean;
  pending?: boolean;
  reason?: string;
  users?: string[]; 
};

export default function Canvas({
  roomId,
  token,
  userId_want_to_join,
  admin_of_room,
}: {
  roomId: number;
  token: string;
  userId_want_to_join: number;
  admin_of_room: number;
}) {
  const { socket, loading } = useSocket(token, roomId);

  const [joined, setJoined] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [gettingShapes, setGettingShapes] = useState(true);
  const [existingShapes, setExistingShapes] = useState<Shape[]>([]);
  const [error, setError] = useState<string | null>(null);


  const { addRequest } = useNotifications();

  useEffect(() => {
    if (!socket || loading || roomId === -1) {
      return;
    }

    socket.emit(
      "room:join",
      { roomId, userId_want_to_join, admin_of_room },
      (res: JoinResult) => {
        if (!res.success) {
          setError(res.reason || "JOIN_FAILED");
          setJoined(false);
          setPendingApproval(false);
          return;
        }

        if (res.pending) {
          setPendingApproval(true);
          setJoined(false);
          return;
        }

        setPendingApproval(false);
        setJoined(true);
      }
    );

    return () => {
      socket.emit("room:leave", { roomId });
      setJoined(false);
      setPendingApproval(false);
    };
  }, [socket, loading, roomId, userId_want_to_join, admin_of_room]);

  // 🔹 FINAL RESULT FROM ADMIN
  useEffect(() => {
    if (!socket) return;

    const handleJoinResult = (res: JoinResult) => {
      if (!res.success) {
        setError(res.reason || "REJECTED_BY_ADMIN");
        setPendingApproval(false);
        setJoined(false);
        return;
      }

      setPendingApproval(false);
      setJoined(true);
    };

    socket.on("room:join:result", handleJoinResult);
    return () => {
      socket.off("room:join:result", handleJoinResult);
    };
  }, [socket]);

  // 🔹 ADMIN: RECEIVE JOIN REQUEST - Add to notification system
  useEffect(() => {
    if (!socket) return;

    socket.on("room:join:request", (data) => {
      console.log("data in notifications", data);
      if (admin_of_room === userId_want_to_join) {
        addRequest(data);
      }
    });
    return () => {
      socket.off("room:join:request");
    };
  }, [socket, admin_of_room, userId_want_to_join, addRequest]);

  // 🔹 FETCH SHAPES AFTER JOIN
  useEffect(() => {
    if (!joined) return;

    async function fetchShapes() {
      try {
        setGettingShapes(true);
        const res = await axios.get<{ data?: Array<{ type: string; data: any }> }>(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/room/chats/${roomId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.data?.data) {
          // Transform database shapes to frontend format
          const transformedShapes: Shape[] = res.data.data.map((dbShape) => ({
            ...dbShape.data,
            type: dbShape.type.toLowerCase() as Shape["type"],
          }));
          setExistingShapes(transformedShapes);
        }
      } catch {
        setError("FETCH_FAILED");
      } finally {
        setGettingShapes(false);
      }
    }

    fetchShapes();
  }, [joined, roomId, token]);

  if(roomId == -1 || token === "dummy") {
    // For dummy token, start with empty shapes (will load from localStorage)
    return (
      <CanvasRoom
        socket={socket}
        roomId={roomId}
        existingShapes={[]}
        token={token}
      />
    );
  }

  // 🔹 UI STATES
  if (loading || !socket) return <div>hi users</div>;
  if (error) return <div>Error: {error}</div>;
  if (pendingApproval) return <div>Waiting for admin approval… ⏳</div>;
  if (!joined || gettingShapes) return <div>Joining room…</div>;

  return (
    <CanvasRoom
      socket={socket}
      roomId={roomId}
      existingShapes={existingShapes}
      token={token}
    />
  );
}
