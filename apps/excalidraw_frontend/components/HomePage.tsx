"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Canvas from "@/components/Canvas";


export default function HomePage({token} : {token : string | null}) {
  const router = useRouter();
  const [slug, setSlug] = useState("");

  return (
    <div>
      {/* 🔹 Join Room UI */}
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <input
          type="text"
          placeholder="join_room"
          className="border border-white rounded px-2 text-white"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <button
          className="bg-green-300 text-black px-4 rounded"


          onClick={() => {

            console.log("button clicked");
            console.log("token: jkdfhdsfklj", token);
            if(token == null) {
              router.push('/signIn');
              return;
            }

            if (slug.trim()) {
              router.push(`/canvas/${slug}`);
            }
          }}
        >
          Join
        </button>
      </div>

      <Canvas roomId={-1} token="null" />
    </div>
  );
}
