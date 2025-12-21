

import {prisma} from "@repo/db"
import { NextFunction, Request, Response, } from "express"
import { CreateRoomSchema } from "@repo/common/typesValidation"

export const CreateRoom = async(req :Request, res : Response , next : NextFunction) =>{
    try {
        const result = CreateRoomSchema.safeParse(req.body);
        if(!result.success){
            return res.status(400).json({messagae: "Validation format"});
        }

        const { name } = result.data;
        
        const RoomExist = await prisma.room.findUnique({
            where:{
                slug : name
            }
        })

        if(RoomExist){
            res.status(401).json({message : "unauthorized access"});
        }

        console.log("user Id : " ,req.userId)
        
        
        if(typeof(req.userId) === "undefined"){
            return res.status(401).json("unauthorised access");
        }
        
        const newRoom = await prisma.room.create({
            data: {
                slug : name,
                adminId : req.userId
            }
        })
        
        return res.status(200).json({message :"new room created" , rooom_id : newRoom.id})
        
    } catch (error) {
        next(error);
    }
}

export const Recent = async(req: Request, res: Response, next: NextFunction) => {
    try {
        const roomId = Number(req.params.roomId);
        const userId = req.userId;
        
        console.log("recent", roomId);
        
        // Validate roomId
        if (isNaN(roomId)) {
            return res.status(400).json({ 
                message: "Invalid room ID" 
            });
        }
        
        // Check if user has access to this room
        const room = await prisma.room.findUnique({
            where: { id: roomId },

        });
        
        if (!room) {
            return res.status(404).json({ 
                message: "Room not found" 
            });
        }
        
        const room_shapes = await prisma.shape.findMany({
            where: { roomId },
        });
        
        return res.status(200).json({ 
            message: "Previous shapes retrieved", 
            data: room_shapes
        });
        
    } catch (error) {
        console.error("Error fetching recent shapes:", error);
        return res.status(500).json({ 
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}

export const RoomId = async(req : Request , res: Response, next : NextFunction) => {
    try {
        
        console.log("recent");
        const slug = (req.params.slug) ;
        const userId = req.userId;
        console.log("name of the rooom " , slug , "and ", userId);


        console.log("hi");
        const room = await prisma.room.findFirst({
            where: {slug},
        })


        
        console.log("no : ", room?.id);

        if(!room) {
            console.log("no room");
            return res.status(400).json({message : `no room with the name ${slug}`})
        }

        console.log("haiin ji");
        return res.status(200).json({message: "here's your room id" ,  data : room.id})
        
    } catch (error) {
        
    }
}   

