import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'

const Verify_jwt = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const header = req.headers['authorization'] || req.headers['Authorization'];
        let token: string | undefined;

        console.log("headers : ", header);

        if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        } else if (typeof header === "string" && header.startsWith("Bearer ")) {
            token = header.split(" ")[1];
        }


        console.log("token :",token);

        if (token === undefined) {
            return res.status(401).json(
                { message: 'unauthorized token missing' }
            )
        };

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);

        if (decoded) {

            req.userId = (decoded as JwtPayload).id;
            next();
        } else {
            return res.status(401).json({ message: "unauthorized" });
        }
    } catch (err) {
        next(new Error("error in verification of jwt"))
    }
}

export default Verify_jwt;  