
"use client";

import { useSocket } from "@/app/hooks/useSocket";
import { useEffect, useState } from "react";
import CanvasRoom from "./CanvasRoom";
import { Shape } from "@/app/draw";
import axios from "axios";

type JoinResult = {
  success: boolean;
  pending?: boolean;
  reason?: string;
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

  // Admin-only: incoming join request
  const [joinRequest, setJoinRequest] = useState<{
    roomId: number;
    userId: number;
  } | null>(null);

  // 🔹 SEND JOIN REQUEST
  useEffect(() => {
    if (!socket || loading || roomId === -1) return;

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

  // 🔹 ADMIN: RECEIVE JOIN REQUEST
  useEffect(() => {
    if (!socket) return;

    socket.on("room:join:request", (data) => {
      setJoinRequest(data);
    });
    return () => {
      socket.off("room:join:request");
    };
  }, [socket]);

  // 🔹 FETCH SHAPES AFTER JOIN
  useEffect(() => {
    if (!joined) return;

    async function fetchShapes() {
      try {
        setGettingShapes(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/room/chats/${roomId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.data?.data) {
          setExistingShapes(res.data.data);
        }
      } catch {
        setError("FETCH_FAILED");
      } finally {
        setGettingShapes(false);
      }
    }

    fetchShapes();
  }, [joined, roomId, token]);

  // 🔹 UI STATES
  if (loading || !socket) return <div>hi users</div>;
  if (error) return <div>Error: {error}</div>;
  if (pendingApproval) return <div>Waiting for admin approval… ⏳</div>;
  if (!joined || gettingShapes) return <div>Joining room…</div>;

  return (
    <>
      {/* 🔹 ADMIN APPROVAL MODAL */}
      {joinRequest && admin_of_room === userId_want_to_join && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow">
            <p>User {joinRequest.userId} wants to join</p>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  console.log("Sending room:join:response", {
                    ...joinRequest,
                    approved: true,
                  });

                  socket.emit("room:join:response", {
                    ...joinRequest,
                    approved: true,
                  });
                  setJoinRequest(null);
                }}
              >
                Allow
              </button>

              <button
                onClick={() => {
                  socket.emit("room:join:response", {
                    ...joinRequest,
                    approved: false,
                  });
                  setJoinRequest(null);
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 CANVAS */}
      <CanvasRoom
        socket={socket}
        roomId={roomId}
        existingShapes={existingShapes}
      />
    </>
  );
}
