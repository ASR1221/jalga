import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { CustomError } from "../types/types";

if (process.env.NODE_ENV !== "production") {
   dotenv.config();
}

export function createSession(req: Request, res: Response, next: NextFunction) {

   const { username, id } = req.user;
   
   jwt.sign(
      {
         id,
      },
      process.env.TOKEN_SECRET as jwt.Secret,
      {
         expiresIn: "7d",
      },
      (err, token) => {
         if (err) {
            return next(err);
         }

         return res.status(200).json({
            sessionToken: token,
            username,
         });
      });
}

export function checkAndRecreateSession(req: Request, res: Response, next: NextFunction) {

   if (!req.headers.authorization) {
      const error = new Error("No session token. Please try logging in") as CustomError;
      error.status = 401;
      return next(error);
   }

   const sessionToken = req.headers.authorization.split("Bearer ")[1];
   if (!sessionToken) {
      const error = new Error("No session token. Please try logging in") as CustomError;
      error.status = 401;
      return next(error);
   }

   jwt.verify(sessionToken, process.env.LOGIN_JWT_SESSION_SECRET as jwt.Secret, (err, data: any) => {
      
      if (err) {
         const error = new Error("Unauthorized. sessionToken has either expired or altered.") as CustomError;
         error.status = 401;
         return next(error)
      }

      const expiresIn = req.path.includes("native") ? "7d" : "15m";
      jwt.sign(
         {
            id: data?.id,
         },
         process.env.LOGIN_JWT_SESSION_SECRET as jwt.Secret,
         {
            expiresIn,
         },
         (error, token) => {
            if (error) {
               return next(error);
            }

            req.user = {
               id: data.id,
               sessionToken: token,
            }
            return next();
         });
   });
}
