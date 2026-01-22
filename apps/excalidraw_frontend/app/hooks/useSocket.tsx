"use client"

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(token: string, roomId : number) {
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<Socket | null>(null);


    console.log("token : " ,token);

    useEffect(() => {
        if (!token) return;

        async function connect() {
            const ws = io(`${process.env.NEXT_PUBLIC_WS_URL}`, {
                query: {
                    token: token
                }
            })

            ws.on('connect' , ()=>{
                setSocket(ws);
                setLoading(false);
            })
            
            ws.on('disconnect', () => {
                setSocket(null);
            })
        }

        connect();
        
        return () => {
            // Cleanup handled by socket.io
        };
    }, [token]);

    return {socket , loading}
}

