"use client";

import React from "react"

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, CheckCircle, Camera, Loader2, User, LogOut } from "lucide-react";

interface ProfileDropdownProps {
  token: string;
  onLogout: () => void;
}

interface UserData{
  email: string;
  id: string;
  name: string;
  photo: string;
}

interface UserProfileResponse{
    data: UserData
}



export function ProfileDropdown({ token, onLogout }: ProfileDropdownProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [username, setUsername] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingUsername, setEditingUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    loadUserProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const loadUserProfile = async () => {
    try {
      const res = await axios.get<UserProfileResponse>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("res.data : ", res.data);
      if (res.data) {
        setUsername(res.data.data.name || "User");
        setPhotoUrl(res.data.data.photo || "");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };


  const handleUpdateUsername = async () => {
    if (!editingUsername.trim()) {
      setError("Username cannot be empty");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/update-username`,
        { username: editingUsername },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsername(editingUsername);
      setIsEditing(false);
      setSuccess("Username updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update username");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload photo
    await uploadPhoto(file);
  };

  const uploadPhoto = async (file: File) => {
    setUploadingPhoto(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await axios.post<UserProfileResponse>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/upload-photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setPhotoUrl(res.data.data.photo);
      setPhotoPreview("");
      setSuccess("Photo updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload photo");
      setPhotoPreview("");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getInitials = () => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isMounted) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="h-9 w-9 p-0 rounded-lg hover:bg-accent/10 transition-colors flex items-center justify-center shrink-0"
        title="Profile"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={photoUrl || "/placeholder.svg"} alt={username} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-accent/20 rounded-xl shadow-lg z-[100] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-accent/20">
            <h3 className="font-semibold text-sm">Profile Settings</h3>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Photo Section */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Photo
                </p>
                <Avatar className="h-16 w-16">
                  <AvatarImage src={photoPreview || photoUrl} alt={username} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
                disabled={uploadingPhoto}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="h-10 w-10 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors flex items-center justify-center text-primary disabled:opacity-50"
                title="Upload photo"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Username Section */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Username
              </p>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    value={editingUsername}
                    onChange={(e) => setEditingUsername(e.target.value)}
                    placeholder="Enter username..."
                    className="h-9 text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleUpdateUsername}
                    disabled={loading}
                    className="h-9 px-3 text-xs shrink-0"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingUsername(username);
                    }}
                    disabled={loading}
                    className="h-9 px-3 text-xs shrink-0"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{username}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="h-8 px-2 text-xs"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Messages */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 p-2 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-emerald-600 text-xs bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-md">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </div>

          {/* Footer - Logout */}
          <div className="border-t border-accent/20 p-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowDropdown(false);
                onLogout();
              }}
              className="w-full justify-start gap-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
