"use client";

import { useSocket } from "@/app/hooks/useSocket";
import { useEffect, useState } from "react";
import CanvasRoom from "./CanvasRoom";
import { Shape } from "@/app/draw";
import axios from "axios";

export default function Canvas({ roomId, token }: { roomId: number; token: string }) {
  const { socket, loading } = useSocket(token, roomId);

  const [joined, setJoined] = useState(false);
  const [gettingShapes, setGettingShapes] = useState(true);

  let existingShapes: Shape[] = [];

  useEffect(() => {
    if (roomId === -1) return;
    if (!socket || loading) return;

    socket.emit("room:join", { roomId });
    setJoined(true);

    async function fetchShapes() {
      try {
        setGettingShapes(true);

        console.log("room id " ,roomId);

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/room/chats/${roomId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log(" jksdfhkladhk ", res.data);

        if (res.data?.data) {
          existingShapes.push(...res.data.data);
        }
      } catch (error) {
        console.error("Error fetching shapes:", error);
      } finally {
        setGettingShapes(false);
      }
    }

    fetchShapes();

    return () => {
      if (socket) {
        socket.emit("room:leave", { roomId });
      }
      setJoined(false);
    };
  }, [socket, loading, roomId, token]);

  if (loading || !socket || !joined || gettingShapes) {
    return <div>Joining room...</div>;
  }

  return <CanvasRoom socket={socket} roomId={roomId} existingShapes = {existingShapes}/>;
}
