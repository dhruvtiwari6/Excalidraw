"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Plus, Users, X, Bell, Check, XCircle } from "lucide-react";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/app/hooks/useNotifications";
import { Socket } from "socket.io-client";
import { useSocket } from "@/app/hooks/useSocket";

interface NavbarProps {
  token: string | null;
}

export default function Navbar({ token }: NavbarProps) {
  const router = useRouter();
  const isAuthenticated = token !== null;
  const [joinRoomSlug, setJoinRoomSlug] = useState("");
  const [createRoomName, setCreateRoomName] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const { requests, removeRequest, setupSocketListeners } = useNotifications();
  
  // Set up global socket connection for notifications
  const { socket: globalSocket } = useSocket(token || "", -1);
  
  useEffect(() => {
    if (isAuthenticated && globalSocket) {
      setupSocketListeners(globalSocket);
    }
  }, [isAuthenticated, globalSocket, setupSocketListeners]);
  
  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);
  
  const handleAcceptRequest = (request: { roomId: number; userId: number; id: string }) => {
    if (!globalSocket) return;
    
    globalSocket.emit("room:join:response", {
      roomId: request.roomId,
      userId: request.userId,
      approved: true,
    });
    removeRequest(request.id);
  };
  
  const handleRejectRequest = (request: { roomId: number; userId: number; id: string }) => {
    if (!globalSocket) return;
    
    globalSocket.emit("room:join:response", {
      roomId: request.roomId,
      userId: request.userId,
      approved: false,
    });
    removeRequest(request.id);
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint with token in header
      if (token) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          }
        );
      }
    } catch (error) {
      // Even if logout endpoint fails, we'll clear the cookie client-side
      console.error("Logout error:", error);
    } finally {
      // Clear the cookie by setting it to expire
      document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/");
      router.refresh();
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomSlug.trim() || !token) return;
    
    setLoading(true);
    setError("");
    try {
      router.push(`/canvas/${joinRoomSlug.trim()}`);
      setShowJoinInput(false);
      setJoinRoomSlug("");
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to join room");
      console.error("Error joining room:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!createRoomName.trim() || !token) return;
    
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/room/createRoom`,
        { name: createRoomName.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status === 200) {
        router.push(`/canvas/${createRoomName.trim()}`);
        setShowCreateInput(false);
        setCreateRoomName("");
        setError("");
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to create room. Room may already exist.");
      console.error("Error creating room:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>Canvas Draw</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {showJoinInput ? (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter room slug"
                    value={joinRoomSlug}
                    onChange={(e) => {
                      setJoinRoomSlug(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !loading && joinRoomSlug.trim()) {
                        handleJoinRoom();
                      }
                      if (e.key === "Escape") {
                        setShowJoinInput(false);
                        setJoinRoomSlug("");
                        setError("");
                      }
                    }}
                    className="h-8 w-48"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleJoinRoom}
                    disabled={loading || !joinRoomSlug.trim()}
                    className="gap-2"
                  >
                    {loading ? "Joining..." : "Join"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowJoinInput(false);
                      setJoinRoomSlug("");
                      setError("");
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setShowJoinInput(true);
                    setShowCreateInput(false);
                    setCreateRoomName("");
                  }}
                >
                  <Users className="h-4 w-4" />
                  Join Room
                </Button>
              )}

              {showCreateInput ? (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter room slug"
                    value={createRoomName}
                    onChange={(e) => {
                      setCreateRoomName(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !loading && createRoomName.trim()) {
                        handleCreateRoom();
                      }
                      if (e.key === "Escape") {
                        setShowCreateInput(false);
                        setCreateRoomName("");
                        setError("");
                      }
                    }}
                    className="h-8 w-48"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateRoom}
                    disabled={loading || !createRoomName.trim()}
                    className="gap-2"
                  >
                    {loading ? "Creating..." : "Create"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCreateInput(false);
                      setCreateRoomName("");
                      setError("");
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    setShowCreateInput(true);
                    setShowJoinInput(false);
                    setJoinRoomSlug("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create Room
                </Button>
              )}

              {error && (
                <span className="text-xs text-destructive max-w-[200px] truncate">
                  {error}
                </span>
              )}

              {/* Notification Icon */}
              <div className="relative" ref={notificationRef}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-4 w-4" />
                  {requests.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                      {requests.length}
                    </span>
                  )}
                </Button>
                
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-[100] max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-border">
                      <h3 className="font-semibold text-sm">Join Requests</h3>
                    </div>
                    {requests.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No pending requests
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {requests.map((request) => (
                          <div key={request.id} className="p-3 hover:bg-accent transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                  User {request.userId}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Wants to join Room {request.roomId}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleAcceptRequest(request)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleRejectRequest(request)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Link href="/signIn">
              <Button variant="default" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
