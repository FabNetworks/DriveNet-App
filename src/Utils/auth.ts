import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { ExtractJwt, Strategy as JWTStrategy } from 'passport-jwt';
import { FabricProxy } from './FabricProxy';
import { SigningSecret } from './constants';
import { JWTContents } from './defs';
import { Request } from 'express';

const fabricProxy = new FabricProxy();

passport.use('login', new LocalStrategy({
  usernameField: 'enrollmentUserId',
  passwordField: 'enrollmentSecret'
}, (userId: string, secret: string, done: (err: any, user?: JWTContents) => void): void =>
{
  // use void operator and nested async to prevent eslint warning
  void (async (): Promise<void> =>
  {
    try {
      const walletKey = await fabricProxy.ensureIdentity(userId, secret);

      done(null, { userId, walletKey });
    } catch (err) {
      done(err);
    }
  })();
})
);

const tokenValidationHandler = (token: JWTContents | null, done: (err: any, token?: JWTContents) => void) =>
{
  try {
    if (!token) {
      throw new Error('No token signed by this server found');
    }

    return done(null, token);
  } catch (err) {
    done(err);
  }
};

passport.use('userToken',
  new JWTStrategy({
    secretOrKey: SigningSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
  }, tokenValidationHandler)
);

passport.use('expiredUserToken',
  new JWTStrategy({
    secretOrKey: SigningSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: true
  }, tokenValidationHandler)
);


passport.use('refreshToken',
  new JWTStrategy({
    secretOrKey: SigningSecret,
    jwtFromRequest: (req: Request): string | null =>
    {
      let token: string | null = null;

      if (req && req.cookies) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        token = req.cookies.refreshToken || null;
      }

      return token;
    }
  }, (token: { refresh: boolean } | null, done: (err: any, token?: { refresh: boolean }) => void) =>
  {
    try {
      if (!token) {
        throw new Error('No token signed by this server found');
      } else if (!token.refresh) {
        throw new Error('Token is not refresh token');
      }

      return done(null, token);
    } catch (err) {
      done(err);
    }
  })
);
