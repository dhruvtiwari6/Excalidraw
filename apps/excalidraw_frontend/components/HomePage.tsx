"use client";

import Canvas from "@/components/Canvas";

export default function HomePage({token} : {token : string | null}) {
  return (
    <div>
      <Canvas roomId={-1} token="dummy" />
    </div>
  );
}
