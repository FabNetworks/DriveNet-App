import express, { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import passport from 'passport';
import { SigningSecret } from '../Utils/constants';
import { JWTContents } from '../Utils/defs';
import { generateAccessToken } from '../Utils/utils';

export const openRoutesRouter = express.Router();

////////// LIVENESS PROBE HEALTH CHECK //////////
// GET /api/v1/healthz
openRoutesRouter.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).send('ok');
});

//////////// READINESS PROBE CHECK /////////////////
// GET /api/v1/ready
openRoutesRouter.get('/ready', (_req: Request, res: Response) => {
  res.status(200).send('ok');
});

//////////// LOGIN /////////////////
// POST /api/v1/login
// body: {enrollmentUserId: string, enrollmentSecret: string}
openRoutesRouter.post('/login', (req: Request, res: Response, next: NextFunction) => {

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  passport.authenticate('login', (err: Error, user: JWTContents) => {
    try {
      if (err || !user) {
        const error = new Error('Failed to login: ' + err?.message);

        return next(error);
      }

      req.login(user, { session: false }, (err) => {
        if (err) {
          return next(err);
        }

        const {token, expiresIn } = generateAccessToken(user.userId, user.walletKey);
        const refreshToken = jwt.sign({refresh: true}, SigningSecret, {expiresIn: 259200}); // 3 days

        res.cookie('refreshToken', refreshToken, {maxAge: 259200000, httpOnly: true, sameSite: true});
        res.json({token, expiresIn});
      });
    } catch (err) {
      return next(err);
    }
  })(req, res, next);
});
