import Canvas from "@/components/Canvas";
import getToken from "@/components/getToken";
import axios from "axios";

type RoomResponse = {
  data: number;
  message: string;
};

type RoomJoinInfo = {
  roomId: number;
  userId_want_to_join: number;
  admin_of_room: number;
};


async function getRoom(slug: string, token: string): Promise<RoomJoinInfo> {


  try {
    const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL;

    if (!baseURL) {
      throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
    }

    console.log("sending request to room : ", slug);

    const res = await axios.get<RoomResponse>(
      `${baseURL}/room/roomName/${slug}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("response for particular room : ",res.data.data)

    return {roomId: res.data.data.id, userId_want_to_join: res.data.data.userId,  admin_of_room: res.data.data.adminId};
  } catch (error: any) {
    console.error("Failed to get room:", error.response?.data || error.message);
    throw new Error("Unable to fetch room");
  }
}


export default async function Canvas1({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const token = await getToken() as string;
  const { slug } = await params;
  const {roomId, userId_want_to_join, admin_of_room} = await getRoom(slug, token);

  if (token == null) {
    return new Response('Unauthorized', { status: 401 });
  }

  return <Canvas roomId = {roomId} userId_want_to_join = {userId_want_to_join} admin_of_room={admin_of_room} token={token}/>;
}



