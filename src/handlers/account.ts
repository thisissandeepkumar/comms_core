import {
  Request, Response, NextFunction
} from 'express';
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
    const {email, password} = req.body;
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
    const token = await account.generateToken();
    res.status(200).json({
      token: token,
      user: account
    });
  } catch (error) {
    next(error);
  }
}