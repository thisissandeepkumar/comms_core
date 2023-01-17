import {
  Request,
  Response,
  NextFunction
} from "express"
import Account from "../models/account";

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