import express, { NextFunction, Request, Response } from "express";

import { createServer } from 'http';
import { Server } from "socket.io";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import logger from "morgan";


const app = express();
const server = createServer(app);
const io = new Server(server, {
   cors: {
      origin: "*",
   }
});

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
// app.use(express.static("public"));

// routes
// app.use("/", router);

// Handling 404 (Not found)
app.use((req: Request, res: Response, next: NextFunction) => {
   res.status(404).json({ message: "Route not found." });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => res.status(err.status || 500).json({ message: err.message }));

// socket handling
io.on("connection", (socket) => {
   
});

app.listen(process.env.PORT || 3000);