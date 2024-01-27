import express, { NextFunction, Response } from "express";

import { createServer } from 'http';
import { Server } from "socket.io";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import logger from "morgan";
import cors from 'cors';

import { SocketUser } from "./types/types";
import { WIN_ARRAYS } from "./constants/constants";
import router from "./routes/userRoute";

const app = express();
const server = createServer(app);

// Development imports
if (process.env.NODE_ENV !== "production") {
   dotenv.config();
   app.use(logger("dev"));
}

// Important middlewares
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.use(compression());
app.use(express.json());
app.use(cors());
// app.use(express.static("public"));

// routes
app.use("/api", router);

// socket connection
const io = new Server(server, {
   cors: {
      origin: "*",
   }
});

// Handling 404 (Not found)
app.use((req, res, next) => {
   res.status(404).json({ message: "Route not found." });
});

// Error handler
app.use((err: any, req: any, res: Response, next: NextFunction) => res.status(err.status || 500).json({ message: err.message }));

// socket handling
io.on("connection", (socket) => {
   
   let player1: SocketUser | null = null;
   let player2: SocketUser | null = null;
   let turns = 1;
   let gameEnded = false;

   socket.on("join-room", (room) => {

      let clientsInRoom = io.sockets.adapter.rooms.get(room)?.size || 0;

      // if 2 players in room, don't accept any more
      if (clientsInRoom === 2) return;

      socket.join(room);
      clientsInRoom = io.sockets.adapter.rooms.get(room)?.size || 0;

      if (clientsInRoom === 2) {
         player2 = {
            userId: socket.id,
         };
         socket.to(room).emit("game-start", socket.id);
      } else if (clientsInRoom === 1) {
         player1 = {
            userId: socket.id,
         };
      }
   });

   socket.on("request-change", (room, playerObj) => {

      let isError = false;
      if (!(room && room.trim())) return;

      if (!(playerObj || playerObj.userId || (playerObj.onBoardPieces && playerObj.onBoardPieces.length === 3) || playerObj.offBoardPieces)) return;

      if (!(turns === 1 || turns === 2)) return;

      // for (let i = 0; i < playerObj.onBoardPieces.length; i++) {
      //    const ele = playerObj.onBoardPieces[i];
         
      //    if (playerObj.userId === player1?.userId && player2 && player2.onBoardPieces && ele === player2.onBoardPieces[i]) {
      //       socket.to(room).emit("not-allowed", playerObj.userId);
      //       isError = true;
      //       return;
      //    } else if (playerObj.userId === player2?.userId && player1 && player1.onBoardPieces && ele === player1.onBoardPieces[i]) {
      //       socket.to(room).emit("not-allowed", playerObj.userId);
      //       isError = true;
      //       return;
      //    }
      // }

      if (isError) return;

      if (turns === 1) turns = 2;
      if (turns === 2) turns = 1;

      
      for (let j = 0; j < WIN_ARRAYS.length; j++) {
         const arr = WIN_ARRAYS[j];
         
         let isWin = true;
         for (let i = 0; i < arr.length; i++) {
            const ele = arr[i];
            if (ele !== playerObj.onBoardPieces[i]) {
               isWin = false;
               socket.to(room).emit("state-change", playerObj, turns);
               break;
            }
         }
         if (isWin) {
            socket.to(room).emit("state-change", playerObj, turns, playerObj.userId);
            gameEnded = true;
            break;
         }
      }

   });

   socket.on("game-restart", (room) => {
      
      if (typeof room !== "string" || room.trim()) return;
      if (!gameEnded) return;

      turns = 1;
      gameEnded = false;
      if (player1) {
         player1.offBoardPieces = 3;
         player1.onBoardPieces = [0, 0, 0];
      }
      if (player2) {
         player2.offBoardPieces = 3;
         player2.onBoardPieces = [0, 0, 0];
      }

      socket.to(room).emit("game-start", turns);
   });

   // the front shoud handle a player-out event

});

// socker port
server.listen(process.env.PORT || 4000);

// server port
app.listen(process.env.PORT || 3000);