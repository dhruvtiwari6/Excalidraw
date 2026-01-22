"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Plus, Users, X } from "lucide-react";
import axios from "axios";
import { useState } from "react";
import { Input } from "@/components/ui/input";

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
