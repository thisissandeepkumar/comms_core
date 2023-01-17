import {
  Request, Response, NextFunction
} from 'express';
import Account from '../models/account';

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