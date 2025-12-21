import express from "express"
import { SignIn, SignUp } from "../Controller/auth.controller.js";

const AuthRouter = express.Router();

AuthRouter.post('/signIn', SignIn);
AuthRouter.post('/signUp', SignUp);

export default AuthRouter;
