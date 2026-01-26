import express from "express"
import AuthRouter from "./router/auth.router.js";
import RoomRouter from "./router/room.router.js"
import UserRouter from "./router/user.router.js"
import cookieParser from "cookie-parser";
import cors from 'cors'
import 'dotenv/config'


const app = express() ;


app.use(
  cors({
    origin: "http://localhost:3000", 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  })
);


app.use(express.json());
app.use(cookieParser());


app.use('/auth', AuthRouter);
app.use('/room', RoomRouter);
app.use('/user', UserRouter);
app.listen(3002 , ()=>{
    console.log("app is listening at 3002 port")
})