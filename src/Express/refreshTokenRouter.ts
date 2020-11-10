import express, { Request, Response } from 'express';
import passport from 'passport';
import { JWTRequest } from '../Utils/defs';
import { generateAccessToken } from '../Utils/utils';


export const refreshTokenRouter = express.Router();
refreshTokenRouter.use(passport.authenticate('refreshToken', {session: false}));
refreshTokenRouter.use(passport.authenticate('expiredUserToken', {session: false}));

//////////// GET REFRESHED TOKEN /////////////////
// GET /api/v1/refresh-token
refreshTokenRouter.get('/refresh-token', (req: Request, res: Response) => {
  const { user } = (req as JWTRequest);

  const {token, expiresIn } = generateAccessToken(user.userId, user.walletKey);

  res.json({token, expiresIn});
});

