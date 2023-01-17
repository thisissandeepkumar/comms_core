import {
  Request,
  Response,
  NextFunction
} from "express"
import { verify } from "jsonwebtoken";
import { ExtendedError } from "socket.io/dist/namespace";
import Account from "../models/account";
import { UnauthorizedError } from "../utils/errors";
import { SocketInstance } from "../utils/socket";

export interface AuthenticatedRequest extends Request {
  userId?: string
}

export default async function auth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if(!token) {
      throw new Error("No token provided");
    }
    const payload = await Account.validateToken(token);
    req.userId = payload._id;
    next();
  } catch (error) {
    next(error);
  }
}

export async function socketAuth(
  socket: SocketInstance,
  next: (err?: ExtendedError | undefined) => void
): Promise<void> {
  try {
    const token = socket.handshake.headers.authorization?.split(" ")[1];
    if (token) {
      const decodedToken = verify(token, process.env.JWT_SECRET!) as {
        _id: string;
      };
      socket.metaData = {
        userId: decodedToken._id,
      };
      next();
    } else {
      throw new UnauthorizedError("Access token not provided");
    }
  } catch (error: any) {
    socket.emit("error", error.message);
    socket.disconnect();
  }
}