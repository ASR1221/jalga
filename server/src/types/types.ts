import { Request } from "express";

export type SocketUser = {
   userId: string,
   onBoardPieces?: number[],
   offBoardPieces?: number,
   yourTurn?: boolean,
}

export interface CustomError extends Error {
   status?: number,
}