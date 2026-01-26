"use client";

import Canvas from "@/components/Canvas";

export default function HomePage({token} : {token : string | null}) {
  return (
    <div>
      <Canvas roomId={-1} token="dummy" userId_want_to_join="dummy" admin_of_room="string"/>
    </div>
  );
}
