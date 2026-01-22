import { Server, Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Redis } from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { prisma } from "@repo/db"
import 'dotenv/config'


const pubClient = new Redis();
const subClient = pubClient.duplicate();

const io = new Server({
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  adapter: createAdapter(pubClient, subClient)
});

io.listen(8080);

const user_id_map_socket_id = new Map<string, string>();
const socket_id_map_user_id = new Map<string, string>();

//runs before every new connection
io.use((socket, next) => {
  try {
    const token = socket.handshake.query.token;

    // console.log("token " , token)

    if (typeof token !== "string") {
      return next(new Error("Unauthorized: token missing"));
    }

    // console.log("secret" , process.env.ACCESS_TOKEN_SECRET)

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as JwtPayload;

    socket.data.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Unauthorized: invalid token"));
  }
});


io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.data.userId);
  });

  // socket.on("room:join" , (data)=> {
  //   socket.join(data.roomId);
  // })
  socket.on("room:join", (data, ack) => {
    const { roomId, userId_want_to_join, admin_of_room } = data;


    console.log("userId ", userId_want_to_join);
    console.log("Admin Id", admin_of_room);
    user_id_map_socket_id.set(String(userId_want_to_join), socket.id);
    socket_id_map_user_id.set(socket.id, String(userId_want_to_join));

    // Admin joining their own room
    if (userId_want_to_join === admin_of_room) {
      console.log("aap shi ho");

      socket.join(roomId);
      return ack?.({ success: true });
    }

    console.log("aap log galat ho");
    // Non-admin: ask for permission
    const adminSocketId = user_id_map_socket_id.get(admin_of_room);

    if (!adminSocketId) {
      return ack?.({ success: false, reason: "ADMIN_OFFLINE" });
    }

    console.log("Sending the room join request to admin");

    io.to(adminSocketId).emit("room:join:request", {
      roomId,
      userId: userId_want_to_join,
    });

    // Tell requester to wait
    return ack?.({ success: true, pending: true });
  });

  socket.on("room:join:response", ({ roomId, userId, approved }) => {
    console.log("request came");
    const userSocketId = user_id_map_socket_id.get(String(userId));

    console.log(userSocketId);
  if (!userSocketId) return;

  console.log("approved: " ,approved);

  if (approved) {

    io.sockets.sockets.get(userSocketId)?.join(roomId);

    io.to(userSocketId).emit("room:join:result", {
      success: true,
      roomId,
    });
  } else {
    io.to(userSocketId).emit("room:join:result", {
      success: false,
      reason: "REJECTED_BY_ADMIN",
    });
  }
  });



  socket.on("room:leave", (data) => {
    socket.leave(data.roomId);
  })

  socket.on("shape:clear", (data) => {
    socket.to(data.roomId).emit("shape:clear", data);
  })

  socket.on("shape:remove", (data) => {
    socket.to(data.roomId).emit("shape:remove", data);
  })

  socket.on('shape:update', (data) => {
    console.log(data);
    socket.to(data.roomId).emit("shape:update", data)
  })

  socket.on("shape:create", async ({ roomId, type, data }) => {

    console.log("shape created");

    socket.to(roomId).emit("shape:created", data);
    await prisma.shape.create({
      data: {
        roomId,
        userId: socket.data.userId,
        type,
        data,
      },
    });
  });

  // socket.on("message" , async(data)=>{
  //   // const parsedData = JSON.parse(data);

  //   // console.log("data ", parsedData);
  //   if(data.type === "join_room"){
  //     console.log("hlo ji");
  //     socket.join(data.roomId);
  //   }

  //   if(data.type === "leave_room") {
  //     socket.leave(data.roomId);
  //   }


  //   if(data.type === "chat"){
  //     console.log("msg recieved : " , data.message);
  //     socket.to(data.roomId).emit("message" ,{type: "chat" , roomId : data.roomId , message: data.message });

  //     await prisma.chat.create({
  //       data: {
  //         roomId : data.roomId,
  //         userId : socket.data.userId,
  //         message: data.message
  //       }
  //     })
  //   }
  // })



});
