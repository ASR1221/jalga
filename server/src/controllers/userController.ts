import { Response, NextFunction, Request } from "express";
import { PrismaClient } from '@prisma/client';

import { CustomError } from "../types/types";

export async function register(req: Request, res: Response, next: NextFunction) {
   const { username, password } = req.body;

   try {
      if (!((username && username.trim()) && (password && password.trim()))) {
         const error = new Error("Missing Information (username or password). Please try again.") as CustomError;
         error.status = 400;
         return next(error);
      }

      const prisma = new PrismaClient();

      // store user in db
      const newUser = await prisma.user.create({
         data: {
            username,
            password,
         }
      });

      req.user = {
         id: newUser.id,
         username,
      }

      return next();

   } catch (e) {
      next(e);
   }
}

export async function signIn(req: Request, res: Response, next: NextFunction) {
   const { id, sessionToken } = req.user;

   try {

      const prisma = new PrismaClient();

      // search for user in db
      const user = await prisma.user.findUnique({
         where: {
            id,
         }
      });

      if (!user) {
         const error = new Error("No user found") as CustomError;
         error.status = 404;
         return next(error);
      }

      return res.status(200).json({
         sessionToken,
         username: user.username,
      });

   } catch (e) {
      next(e);
   }
}