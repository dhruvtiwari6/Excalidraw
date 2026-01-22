import express from "express"
import { SignIn, SignUp, Logout } from "../Controller/auth.controller.js";
import Verify_jwt from "../middleware/auth.middleware.js";

const AuthRouter = express.Router();

AuthRouter.post('/signIn', SignIn);
AuthRouter.post('/signUp', SignUp);
AuthRouter.post('/logout', Verify_jwt, Logout);


export default AuthRouter;
