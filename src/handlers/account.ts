import {
  Request, Response, NextFunction
} from 'express';
import { ObjectId } from 'mongodb';
import { AuthenticatedRequest } from '../middlewares/auth';
import Account from '../models/account';
import { InvalidDataError, NotFoundError } from '../utils/errors';

export async function registerAccountHandler(
  req: Request, res: Response, next: NextFunction
) {
  try {
    let account = await Account.parse({
      ...req.body,
      createdAt: new Date(),
    });
    await account.register(req.body.password);
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
}

export async function loginAccountHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const {email, password, fcmToken} = req.body;
    const accounts = await Account.fetch({
      email: email
    })
    if(accounts.length === 0) {
      throw new NotFoundError("Account not found");
    }
    const account = accounts[0];
    const passwordMatch = await account.validatePassword(password);
    if(!passwordMatch) {
      throw new InvalidDataError("Invalid password");
    }
    const token = await account.generateToken(fcmToken as string);
    res.status(200).json({
      token: token,
      user: account
    });
  } catch (error) {
    next(error);
  }
}

export async function persistedUserDetailsHandlers(
  req: AuthenticatedRequest, res: Response, next: NextFunction
) {
  try {
    const accounts = await Account.fetch({
      _id: new ObjectId(req.userId!)
    })
    if(accounts.length === 0) {
      throw new NotFoundError("Account not found");
    }
    res.status(200).json(accounts[0]);
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const account = await Account.fetch({
      _id: new ObjectId(req.userId!)
    })
    if(!account) {
      throw new NotFoundError("Account not found");
    }
    await account[0].removeToken(req.body.token);
    res.status(200).json({
      message: "Logged out"
    });
  } catch (error) {
    next(error);
  }
}