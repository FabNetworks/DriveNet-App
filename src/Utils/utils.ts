import * as jwt from 'jsonwebtoken';
import { SigningSecret } from './constants';
import { JWTContents } from './defs';

// converts string to safe integer
export function strictFilterInt(valueToParse: string): number
{
  if (/^[-+]?(\d+)$/.test(valueToParse)) {
    const val = Number(valueToParse);
    if (val > Number.MAX_SAFE_INTEGER) {
      throw Error(`invalid numeric value provided - '${valueToParse}' is to large`);
    } else if (val < Number.MIN_SAFE_INTEGER) {
      throw Error(`invalid numeric value provided - '${valueToParse}' is to small`);
    } else {
      return val;
    }
  } else {
    throw Error(`invalid value provided - '${valueToParse}' is not a Number`);
  }
}


// create access token for use in protected routes
export function generateAccessToken(userId: string, walletKey: string): {token: string, expiresIn: number} {
  const expiresIn = 900;
  const token = jwt.sign({ userId, walletKey } as JWTContents, SigningSecret, {expiresIn});

  return {token, expiresIn};
}