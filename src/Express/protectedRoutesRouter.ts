import express, { Request, Response } from 'express';
import passport from 'passport';
import { Transactions } from '../Transactions/Transactions';
import { JWTRequest } from '../Utils/defs';
import { FabricProxy } from '../Utils/FabricProxy';

const fabricProxy = new FabricProxy();

// define the router
export const protectedRoutesRouter = express.Router();
protectedRoutesRouter.use(passport.authenticate('userToken', { session: false }));

//////////// GET NETWORK CARS /////////////////
// GET /api/v1/vehicles
protectedRoutesRouter.get('/vehicles', async (req: Request, res: Response) =>
{
  const { user } = (req as JWTRequest);

  const transactions = new Transactions(user.walletKey, fabricProxy);

  try {
    const response = await transactions.queryAllCars();

    res.send(response);
  } catch (err) {
    sendExceptionResponse(err, 'Error retrieving vehicles', res);
  }
});


//////////// CREATE CAR /////////////////
// POST /api/v1/vehicles
// body: {carNumber: string, make: string, model: string, colour: string, owner: string}
protectedRoutesRouter.post('/vehicles', async (req: Request, res: Response) =>
{
  const { user } = (req as JWTRequest);
  const transactions = new Transactions(user.walletKey, fabricProxy);

  const body = req.body as { carNumber: string, make: string, model: string, colour: string, owner: string }; // TODO make real type

  try {
    const response = await transactions.createVehicle(body.carNumber, body.make, body.model, body.colour, body.owner);

    res.send(response);
  } catch (err) {
    sendExceptionResponse(err, 'Error creating car', res);
  }
});

//////////// GET HISTORY /////////////////
// GET /api/v1/:vehicle/history
protectedRoutesRouter.get('/:vehicle/history', async (req: Request, res: Response) =>
{
  const { user } = (req as JWTRequest);

  const transactions = new Transactions(user.walletKey, fabricProxy);

  try {
    const response = await transactions.getPreviousOwners(req.params.vehicle);

    res.send(response);
  } catch (err) {
    sendExceptionResponse(err, 'Error retrieving vehicle history', res);
  }
});

//////////// DELETE CAR /////////////////
// DELETE /api/v1/:vehicle
protectedRoutesRouter.delete('/:vehicle', async (req: Request, res: Response) =>
{
  const { user } = (req as JWTRequest);
  const transactions = new Transactions(user.walletKey, fabricProxy);

  try {
    const response = await transactions.deleteVehicle(req.params.vehicle);

    res.send(response);
  } catch (err) {
    sendExceptionResponse(err, 'Error deleting car', res);
  }
});

//////////// UPDATE OWNER /////////////////
// PUT /api/v1/:vehicle/owner
// body: {owner: string}
protectedRoutesRouter.put('/:vehicle/owner', async (req: Request, res: Response) =>
{
  const { user } = (req as JWTRequest);
  const transactions = new Transactions(user.walletKey, fabricProxy);

  const body = req.body as { owner: string };

  try {
    const response = await transactions.changeOwner(req.params.vehicle, body.owner);

    res.send(response);
  } catch (err) {
    sendExceptionResponse(err, 'Error updating vehicle owner', res);
  }
});

//////////// CONFIRM OWNER /////////////////
// put /api/v1/:vehicle/owner/confirm
protectedRoutesRouter.put('/:vehicle/owner/confirm', async (req: Request, res: Response) =>
{
  const { user } = (req as JWTRequest);
  const transactions = new Transactions(user.walletKey, fabricProxy);

  try {
    const response = await transactions.confirmOwner(req.params.vehicle);

    res.send(response);
  } catch (err) {
    sendExceptionResponse(err, 'Error confirming ownership', res);
  }
});

//////////// GET LOGGED IN USER CARS /////////////////
// GET /api/v1/user/vehicles
protectedRoutesRouter.get('/user/vehicles', async (req: Request, res: Response) =>
{
  const { user } = (req as JWTRequest);
  const transactions = new Transactions(user.walletKey, fabricProxy);

  try {
    const response = await transactions.getCallerVehicles();

    res.send(response);
  } catch (err) {
    sendExceptionResponse(err, 'Error retrieving caller vehicles', res);
  }
});

//////////// GET SPECIFIC USER CARS /////////////////
// GET /api/v1/:user/vehicles
protectedRoutesRouter.get('/:user/vehicles', async (req: Request, res: Response) =>
{
  const { user } = (req as JWTRequest);
  const transactions = new Transactions(user.walletKey, fabricProxy);

  try {
    const response = await transactions.queryByOwner(req.params.user);

    res.send(response);
  } catch (err) {
    sendExceptionResponse(err, 'Error retrieving specific user cars', res);
  }
});


// sendExceptionResponse
function sendExceptionResponse(exception: Error, insert: string, res: express.Response<any>): void
{
  const errorMsg = exception.message;
  console.log(errorMsg);

  // This is to work around an invalid token passed in from the client
  // It happens if the DriveNet App is redeployed, losing all current enrolled user wallets,
  // but a client still has a token in a cookie that is no longer valid. So this error
  // triggers the client to log the user out and force them to login in again.
  if (errorMsg.includes('Identity not found in wallet for key')) {
    // We send a 410 GONE error because 401 could be regular auth failure but here, the wallet has GONE
    console.log('Sending 410: ' + errorMsg);

    // prevent this response being cached by the client as a 410 response if cached by most browsers
    res.setHeader('Cache-Control', 'no-store');
    res.status(410);
    res.send('Auth error');
  } else {
    res.status(500);
    res.send(insert + ': ' + errorMsg);
  }
}