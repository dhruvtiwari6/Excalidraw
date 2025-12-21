import { NextFunction, Request, Response } from "express"
import {prisma} from "@repo/db"
import {CreateUserSchema, SignInSchema} from '@repo/common/typesValidation'
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { CookieOptions } from "express"


const generateAccessAndRefreshToken = async (userId: string) => {
    const accessSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!accessSecret || !refreshSecret) {
        throw new Error("Token secrets not found");
    }

    const accessToken = jwt.sign(
        { id: userId },
        accessSecret,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { id: userId },
        refreshSecret,
        { expiresIn: "7d" }
    );

    return {
        accessToken,
        refreshToken
    };
};


export const SignIn = async(req : Request, res : Response , next : NextFunction) => {
    try{

        const result = SignInSchema.safeParse(req.body);
        if(!result.success){
            return res.status(400).json({messagae: "Validation format"});
        }

        const {email , password} = result.data;
        const user = await prisma.user.findUnique({
            where: {email : email}
        })

        if(!user){
            return res.status(404).json({message : "user does not exist"});
        }

        const isCorrect = await bcrypt.compare(password , user.password);
        if(!isCorrect){
            return res.json(404).json({mesage : "user does not exist"});
        }

        const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user.id);
        
        const options : CookieOptions = {
            httpOnly : true,
            secure : true,
            sameSite: "none"
        };

        return res
                .status(200)
                .setHeader("Authorization", `Bearer ${accessToken}`)
                .cookie("accessToken" ,accessToken , options)
                .cookie("refreshToken" , refreshToken , options)
                .json({message : `user logged ` , accessToken: accessToken , userId : user.id})

    }catch(error){
        next(error);
    }
}

export const  SignUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await req.body;
    console.log(d);
    const result = CreateUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid input format" });
    }

    const { name, email, password } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(newUser.id);

      console.log("accessToken ", accessToken);
      console.log("refresh token " , refreshToken);

    const options: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };

    return res
      .status(201)
      .setHeader("Authorization", `Bearer ${accessToken}`)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        message: "User created successfully",
        userId: newUser.id,
        accessToken: accessToken
      });
  } catch (error) {
    next(error);
  }
};

