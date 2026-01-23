

import { prisma } from "@repo/db"
import { NextFunction, Request, Response, } from "express"

export const UpdateUsername = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                name: req.body.username
            }
        })

        return res.status(200).json({ message: "current user", data: user });
    } catch (error) {
        next(error);
    }
}


export const Profile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.findFirst({
            where: { id: userId },
        })

        return res.status(200).json({ message: "current user", data: user });
    } catch (error) {
        next(error);
    }
}