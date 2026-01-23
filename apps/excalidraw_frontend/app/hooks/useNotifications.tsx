// "use client";

// import { createContext, useContext, useState, useEffect, ReactNode } from "react";
// import { Socket } from "socket.io-client";

// interface JoinRequest {
//   id: string; // roomId-userId combination for uniqueness
//   roomId: number;
//   userId: string;
//   timestamp: number;
// }

// interface NotificationContextType {
//   requests: JoinRequest[];
//   addRequest: (request: Omit<JoinRequest, "timestamp" | "id">) => void;
//   removeRequest: (id: string) => void;
//   setupSocketListeners: (socket: Socket | null) => void;
// }

// const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// export function NotificationProvider({ children }: { children: ReactNode }) {
//   const [requests, setRequests] = useState<JoinRequest[]>([]);
//   const [socket, setSocket] = useState<Socket | null>(null);

//   const addRequest = (request: Omit<JoinRequest, "timestamp" | "id">) => {
//     const id = `${request.roomId}-${request.userId}`;
//     setRequests((prev) => {
//       // Avoid duplicates
//       if (prev.some((r) => r.id === id)) return prev;
//       return [...prev, { ...request, id, timestamp: Date.now() }];
//     });
//   };

//   const removeRequest = (id: string) => {
//     setRequests((prev) => prev.filter((r) => r.id !== id));
//   };

//   const setupSocketListeners = (newSocket: Socket | null) => {
//     // Clean up old socket listeners
//     if (socket) {
//       socket.off("room:join:request");
//     }

//     if (newSocket) {
//       // newSocket.on("room:join:request", (data: { roomId: number; userId: number }) => {
//       //   addRequest(data);
//       // });


//       newSocket.on(
//         "room:join:request",
//         (data: { roomId: number; userId: string[] }) => {

//           console.log("data in notifications", data);
//           data.userId.forEach((uid) => {
//             addRequest({
//               roomId: data.roomId,
//               userId: uid,
//             });
//           });
//         }
//       );
      
//       setSocket(newSocket);
//     }
//   };

//   return (
//     <NotificationContext.Provider
//       value={{ requests, addRequest, removeRequest, setupSocketListeners }}
//     >
//       {children}
//     </NotificationContext.Provider>
//   );
// }

// export function useNotifications() {
//   const context = useContext(NotificationContext);
//   if (!context) {
//     throw new Error("useNotifications must be used within NotificationProvider");
//   }
//   return context;
// }


"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Socket } from "socket.io-client";

interface JoinRequest {
  id: string; // roomId-userId combination
  roomId: number;
  userId: string;     // ✅ FIXED
  timestamp: number;
}

interface NotificationContextType {
  requests: JoinRequest[];
  addRequest: (request: Omit<JoinRequest, "timestamp" | "id">) => void;
  removeRequest: (id: string) => void;
  setupSocketListeners: (socket: Socket | null) => void;
}

const NotificationContext =
  createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  // const addRequest = (request: Omit<JoinRequest, "timestamp" | "id">) => {
  //   const id = `${request.roomId}-${request.userId}`;
  //   console.log("request in notifications", request);

    
  //   setRequests((prev) => {
  //     if (prev.some((r) => r.id === id)) return prev;
  //     console.log("Sd ", [...prev, { ...request, id, timestamp: Date.now() }])
  //     return [...prev, { ...request, id, timestamp: Date.now() }];
  //   });
  // };

  const addRequest = (request: Omit<JoinRequest, "timestamp" | "id">) => {
    console.log("request in notifications", request);
  
    setRequests((prev) => {
      const existing = new Set(prev.map((r) => r.id));
  
      // 🔑 Normalize: always work with an array internally
      const userIds = Array.isArray(request.userId)
        ? request.userId
        : [request.userId];
  
      const next = userIds.map((uid) => ({
        id: `${request.roomId}-${uid}`,
        roomId: request.roomId,
        userId: uid,              // ✅ SINGLE STRING
        timestamp: Date.now(),
      }));
  
      return [
        ...prev,
        ...next.filter((r) => !existing.has(r.id)),
      ];
    });
  };
  

  const removeRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  // const setupSocketListeners = (newSocket: Socket | null) => {
  //   // if (socket) {
  //   //   socket.off("room:join:request");
  //   // }

  //   console.log("asdgajkdfasldfh jklhn klhsfln h")

  //   if (socket) {
  //     socket.removeAllListeners("room:join:request");
  //   }
    

  //   if (newSocket) {
  //     // newSocket.on(
  //     //   "room:join:request",
  //     //   (data: { roomId: number; userId: string[] }) => {
  //     //     console.log("data in notifications", data);
  //     //     data.userId.forEach((uid) => {
  //     //       addRequest({
  //     //         roomId: data.roomId,
  //     //         userId: uid,
  //     //       });
  //     //     });
  //     //   }
  //     // );

      
  //     // newSocket.on(
  //     //   "room:join:request",
  //     //   (data: { roomId: number; userId: string[] }) => {
          
  //     //     // console.log("adfklhasdflk  nhlkfha adf ")
  //     //     console.log("madkfjasoidga;od")
      
  //     //     setRequests((prev) => {
  //     //       const existing = new Set(prev.map((r) => r.id));
      
  //     //       const next = data.userId.map((uid) => ({
  //     //         id: `${data.roomId}-${uid}`,
  //     //         roomId: data.roomId,
  //     //         userId: uid,          // ✅ SINGLE STRING
  //     //         timestamp: Date.now(),
  //     //       }));
      
  //     //       return [
  //     //         ...prev,
  //     //         ...next.filter((r) => !existing.has(r.id)),
  //     //       ];
  //     //     });
  //     //   }
  //     // );
      
      

  //     setSocket(newSocket);
  //   }
  // };

  return (
    <NotificationContext.Provider
      value={{ requests, addRequest, removeRequest }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}

