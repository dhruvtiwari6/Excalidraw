"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";

export default function AuthPage({ isSignIn }: { isSignIn: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleClick() {
    try {
      setLoading(true);

      const payload = isSignIn
        ? { email, password }
        : { name, email, password };

      const url = isSignIn
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signIn`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signUp`;

      const res : any= await axios.post(url, payload, {
        withCredentials: true,
      });

      if (res.status === 200 || res.status === 201) {
        // console.log(res.data);
        router.push("/Home");
      }
    } catch (error: any) {
      console.error("Auth error:", error);

      alert(
        error?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-96 rounded-lg border border-gray-700 p-6">
        <h1 className="mb-4 text-xl font-semibold text-white">
          {isSignIn ? "Sign In" : "Sign Up"}
        </h1>

        {!isSignIn && (
          <input
            type="text"
            placeholder="Name"
            className="mb-3 w-full rounded bg-gray-800 p-2 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          className="mb-3 w-full rounded bg-gray-800 p-2 text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="mb-4 w-full rounded bg-gray-800 p-2 text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          disabled={loading}
          onClick={handleClick}
          className="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : isSignIn
            ? "Sign In"
            : "Create Account"}
        </button>
      </div>
    </div>
  );
}
