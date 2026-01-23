
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Plus, Users, X, Bell, Check, XCircle } from "lucide-react";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/app/hooks/useNotifications";
import { useSocket } from "@/app/hooks/useSocket";

interface NavbarProps {
  token: string | null;
}

export function Navbar({ token }: NavbarProps) {
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
  
  const { requests, removeRequest} = useNotifications();
  const { socket: globalSocket } = useSocket(token || "", -1);
  
  // useEffect(() => {
  //   if (isAuthenticated && globalSocket) {
  //     setupSocketListeners(globalSocket);
  //   }
  // }, [isAuthenticated, globalSocket, setupSocketListeners]);


  console.log("token in Navbar: " , token);
  
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
      console.log("token while logging Out : ", token);
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
      console.error("Logout error:", error);
    } finally {
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

  const closeInputs = () => {
    setShowJoinInput(false);
    setShowCreateInput(false);
    setJoinRoomSlug("");
    setCreateRoomName("");
    setError("");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-accent/20 bg-background/98 backdrop-blur-md supports-[backdrop-filter]:bg-background/95">
      <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto w-full">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300">
            <svg
              className="h-5 w-5 text-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13 3v8h8V3h-8zm0 10V5h-2v8h2zm-4 0h2V5h-2v8zm6-2h2V5h-2v6z" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight hidden sm:inline text-foreground">
            Canvas
          </span>
        </Link>

        {/* Center Actions - Desktop Only */}
        <div className="hidden lg:flex items-center gap-3 flex-1 mx-8">
          {isAuthenticated && (
            <>
              {showJoinInput ? (
                <div className="flex items-center gap-2 bg-accent/5 px-3 py-1.5 rounded-lg border border-accent/20 flex-1 max-w-xs">
                  <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="Room slug..."
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
                        closeInputs();
                      }
                    }}
                    className="h-6 border-0 bg-transparent p-0 placeholder:text-xs focus:ring-0 text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleJoinRoom}
                    disabled={loading || !joinRoomSlug.trim()}
                    className="h-6 px-2 text-xs rounded-md flex-shrink-0"
                  >
                    {loading ? "..." : "Join"}
                  </Button>
                  <button
                    onClick={closeInputs}
                    className="p-0.5 hover:bg-accent/20 rounded-md transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-accent/30 hover:bg-accent/5 text-xs bg-transparent"
                  onClick={() => {
                    setShowJoinInput(true);
                    setShowCreateInput(false);
                  }}
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden md:inline">Join Room</span>
                </Button>
              )}

              {showCreateInput ? (
                <div className="flex items-center gap-2 bg-accent/5 px-3 py-1.5 rounded-lg border border-accent/20 flex-1 max-w-xs">
                  <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    placeholder="Room name..."
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
                        closeInputs();
                      }
                    }}
                    className="h-6 border-0 bg-transparent p-0 placeholder:text-xs focus:ring-0 text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateRoom}
                    disabled={loading || !createRoomName.trim()}
                    className="h-6 px-2 text-xs rounded-md flex-shrink-0"
                  >
                    {loading ? "..." : "Create"}
                  </Button>
                  <button
                    onClick={closeInputs}
                    className="p-0.5 hover:bg-accent/20 rounded-md transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 text-xs rounded-lg"
                  onClick={() => {
                    setShowCreateInput(true);
                    setShowJoinInput(false);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:inline">Create</span>
                </Button>
              )}

              {error && (
                <span className="text-xs text-destructive max-w-[150px] truncate flex-shrink-0">
                  {error}
                </span>
              )}
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {(token !== "dummy") ? (
            <>
              {/* Mobile Menu - Show on small screens */}
              <div className="flex lg:hidden gap-1">
                {!showJoinInput && !showCreateInput && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-lg hover:bg-accent/10"
                      onClick={() => {
                        setShowJoinInput(true);
                        setShowCreateInput(false);
                      }}
                      title="Join room"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-lg hover:bg-accent/10"
                      onClick={() => {
                        setShowCreateInput(true);
                        setShowJoinInput(false);
                      }}
                      title="Create room"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-lg hover:bg-accent/10 relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {requests.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-semibold">
                      {requests.length > 9 ? '9+' : requests.length}
                    </span>
                  )}
                </Button>
                
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-accent/20 rounded-xl shadow-lg z-[100] max-h-96 overflow-y-auto">
                    <div className="sticky top-0 bg-background p-4 border-b border-accent/20">
                      <h3 className="font-semibold text-sm">Join Requests</h3>
                    </div>
                    {requests.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No pending requests</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-accent/10">
                        {requests.map((request) => (
                          <div key={request.id} className="p-4 hover:bg-accent/5 transition-colors group">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                    {request.userId}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Wants to join Room {request.roomId}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 transition-colors"
                                  onClick={() => handleAcceptRequest(request)}
                                  title="Accept"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 transition-colors"
                                  onClick={() => handleRejectRequest(request)}
                                  title="Reject"
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

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-9 px-3 gap-2 rounded-lg hover:bg-destructive/10 hover:text-destructive text-foreground transition-colors text-xs hidden sm:flex"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>

              {/* Mobile Logout - Icon only */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-9 w-9 p-0 rounded-lg hover:bg-destructive/10 text-foreground sm:hidden"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link href="/signIn">
              <Button variant="default" size="sm" className="gap-2 rounded-lg text-xs">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Expanded Input Area */}
      {isAuthenticated && (showJoinInput || showCreateInput) && (
        <div className="lg:hidden border-t border-accent/20 bg-accent/2 px-6 py-3">
          <div className="flex gap-2">
            {showJoinInput && (
              <div className="flex items-center gap-2 flex-1 bg-background border border-accent/30 px-3 py-2 rounded-lg">
                <Input
                  placeholder="Room slug..."
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
                      closeInputs();
                    }
                  }}
                  className="border-0 bg-transparent p-0 focus:ring-0 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleJoinRoom}
                  disabled={loading || !joinRoomSlug.trim()}
                  className="h-7 px-2 text-xs flex-shrink-0 rounded-md"
                >
                  {loading ? "..." : "Join"}
                </Button>
              </div>
            )}

            {showCreateInput && (
              <div className="flex items-center gap-2 flex-1 bg-background border border-accent/30 px-3 py-2 rounded-lg">
                <Input
                  placeholder="Room name..."
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
                      closeInputs();
                    }
                  }}
                  className="border-0 bg-transparent p-0 focus:ring-0 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleCreateRoom}
                  disabled={loading || !createRoomName.trim()}
                  className="h-7 px-2 text-xs flex-shrink-0 rounded-md"
                >
                  {loading ? "..." : "Create"}
                </Button>
              </div>
            )}

            <button
              onClick={closeInputs}
              className="p-2 hover:bg-accent/20 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {error && (
            <p className="text-xs text-destructive mt-2">{error}</p>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;

