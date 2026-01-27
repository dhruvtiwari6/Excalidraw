import { Server, Socket } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Redis } from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { prisma } from "@repo/db"
import 'dotenv/config'


const pubClient = new Redis({
  host: "redis",   // hardcode for now, remove env ambiguity
  port: 6379,
  retryStrategy(times) {
    console.log("Redis retry attempt:", times);
    return Math.min(times * 100, 2000);
  },
});


const subClient = pubClient.duplicate();

const io = new Server({
  cors: {
    origin: [
      "http://localhost:3000",                 // local dev
      "https://excalidraw.dhruv-tiwari.me"      // production
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  adapter: createAdapter(pubClient, subClient)
});

io.listen(8080);

// const user_id_map_socket_id = new Map<string, string>();
// const socket_id_map_user_id = new Map<string, string>();

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
    socket.data.name = decoded.name;
    next();
  } catch (err) {
    next(new Error("Unauthorized: invalid token"));
  }
});


io.on("connection", async (socket) => {
  console.log("hi");
  socket.on("disconnect", async () => {
    const userId = await pubClient.get(`socket_user:${socket.id}`);

    if (userId) {
      await pubClient.del(`user_socket:${userId}`);
      await pubClient.del(`socket_user:${socket.id}`);
    }

    console.log("User disconnected:", userId);
  });



  socket.on("room:join", async (data, ack) => {
    const { roomId, userId_want_to_join, admin_of_room } = data;
    if (userId_want_to_join !== admin_of_room) {
      pubClient.sadd(`room:${roomId}:users`, String(userId_want_to_join));
      pubClient.sadd(`room:${roomId}:users_name`, String(socket.data.name));

    }

    await pubClient.set(`user:${userId_want_to_join}:name`, socket.data.name);

    // console.log("userId ", userId_want_to_join);
    // console.log("Admin Id", admin_of_room);
    await pubClient.set(
      `user_socket:${userId_want_to_join}`,
      socket.id
    );

    await pubClient.set(
      `socket_user:${socket.id}`,
      String(userId_want_to_join)
    );


    const adminSocketId = await pubClient.get(
      `user_socket:${admin_of_room}`
    );

    if (!adminSocketId) {
      console.log("Admin offline");
      return ack?.({ success: false, reason: "ADMIN_OFFLINE" });
    }

    // Admin joining their own room
    if (userId_want_to_join === admin_of_room) {
      // const users_wanting = await pubClient.smembers(`room:${roomId}:users_name`);
      // console.log("users_wanting", users_wanting);
      // io.to(adminSocketId).emit("room:join:request", {
      //   roomId,
      //   userId: users_wanting,
      //   name: users_wanting.map()
      // });


      const userIds = await pubClient.smembers(`room:${roomId}:users`);
      console.log("haha ", userIds);

      const users = await Promise.all(
        userIds.map(async (userId) => {
          const name = await pubClient.get(`user:${userId}:name`);
          console.log("username :", name);
          return { userId, name };
        })
      );

      console.log("dfad :", users);

      io.to(adminSocketId).emit("room:join:request", {
        roomId,
        users
      });

      socket.join(roomId);
      return ack?.({ success: true });
    }

    console.log("aap log galat ho");

    // Non-admin: ask for permission
    console.log("Sending the room join request to admin");

    io.to(adminSocketId).emit("room:join:request", {
      roomId,
      users: [
        {
          userId: userId_want_to_join,
          name: socket.data.name,
        }
      ]
    });

    // Tell requester to wait
    return ack?.({ success: true, pending: true });
  });

  socket.on("room:join:response", async ({ roomId, userId, approved }) => {
    console.log("request came");
    // const userSocketId = user_id_map_socket_id.get(String(userId));

    const userSocketId = await pubClient.get(
      `user_socket:${userId}`
    );


    console.log(userSocketId);
    if (!userSocketId) return;

    console.log("approved: ", approved);
    pubClient.srem(`room:${roomId}:users`, String(userId));

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

  socket.on("shape:clear", async (data) => {
    socket.to(data.roomId).emit("shape:clear", data);
    await prisma.shape.deleteMany({
      where: {
        roomId: data.roomId,
      },
    });

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

  // socket.on("shape:save", async ({ roomId, shapes }) => {
  //   console.log("Saving shapes for room:", roomId, "Count:", shapes.length);

  //   try {
  //     // Delete all existing shapes for this room
  //     await prisma.shape.deleteMany({
  //       where: { roomId },
  //     });

  //     // Create new shapes
  //     if (shapes && shapes.length > 0) {
  //       await prisma.shape.createMany({
  //         data: shapes.map((shape: any) => ({
  //           roomId,
  //           userId: socket.data.userId,
  //           type: shape.type.toUpperCase(),
  //           data: shape,
  //         })),
  //       });
  //     }

  //     // Broadcast saved shapes to all users in the room
  //     io.to(roomId).emit("shape:saved", {
  //       roomId,
  //       shapes,
  //     });

  //     console.log("Shapes saved and broadcasted to room:", roomId);
  //   } catch (error) {
  //     console.error("Error saving shapes:", error);
  //   }
  // });

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
