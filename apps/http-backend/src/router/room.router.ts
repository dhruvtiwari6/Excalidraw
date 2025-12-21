import express from 'express'
import Verfiy_jwt from "../middleware/auth.middleware.js"
import { CreateRoom , Recent, RoomId} from '../Controller/room.controller.js';
import Verify_jwt from '../middleware/auth.middleware.js';


const  RoomRouter = express.Router();
RoomRouter.post('/createRoom', Verfiy_jwt, CreateRoom)
RoomRouter.get('/chats/:roomId', Verify_jwt , Recent);
RoomRouter.get('/roomName/:slug', Verify_jwt , RoomId);


export default RoomRouter;