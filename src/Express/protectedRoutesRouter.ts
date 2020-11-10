import express, { Request, Response } from 'express';
import passport from 'passport';
import { Transactions } from '../Transactions/Transactions';
import { JWTRequest } from '../Utils/defs';
import { FabricProxy } from '../Utils/FabricProxy';

const fabricProxy = new FabricProxy();

// define the router
export const protectedRoutesRouter = express.Router();
protectedRoutesRouter.use(passport.authenticate('userToken', {session: false}));

//////////// GET NETWORK CARS /////////////////
// GET /api/v1/vehicles
protectedRoutesRouter.get('/vehicles', async (req: Request, res: Response) => {
  const { user } = (req as JWTRequest);

  const transactions = new Transactions(user.walletKey, fabricProxy);

  try {
    const response = await transactions.queryAllCars();

    res.send(response);
  } catch (err) {
    res.status(500);
    res.send('Error retrieving vehicles ' + (err as Error).message);
  }
});


//////////// CREATE CAR /////////////////
// POST /api/v1/vehicles
// body: {carNumber: string, make: string, model: string, colour: string, owner: string}
protectedRoutesRouter.post('/vehicles', async (req: Request, res: Response) => {
  const { user } = (req as JWTRequest);
  const transactions = new Transactions(user.walletKey, fabricProxy);

  const body = req.body as {carNumber: string, make: string, model: string, colour: string, owner: string}; // TODO make real type

  try {
    const response = await transactions.createVehicle(body.carNumber, body.make, body.model, body.colour, body.owner);

    res.send(response);
  } catch (err) {
    console.log(err);

    res.status(500);
    res.send((err as Error).message);
  }
});

//////////// GET HISTORY /////////////////
// GET /api/v1/:vehicle/history
protectedRoutesRouter.get('/:vehicle/history', async (req: Request, res: Response) => {
  const { user } = (req as JWTRequest);

  const transactions = new Transactions(user.walletKey, fabricProxy);

  try {
    const response = await transactions.getPreviousOwners(req.params.vehicle);

    res.send(response);
  } catch (err) {
    res.status(500);
    res.send('Error retrieving vehicle history ' + (err as Error).message);
  }
});

//////////// UPDATE OWNER /////////////////
// DELETE /api/v1/:vehicle
protectedRoutesRouter.delete('/:vehicle', async (req: Request, res: Response) => {
  const { user } = (req as JWTRequest);
  const transactions = new Transactions(user.walletKey, fabricProxy);

  try {
    const response = await transactions.deleteVehicle(req.params.vehicle);

    res.send(response);
  } catch (err) {
    res.status(500);
    res.send('Error updating vehicle owner ' + (err as Error).message);
  }
});

//////////// UPDATE OWNER /////////////////
// PUT /api/v1/:vehicle/owner
// body: {owner: string}
protectedRoutesRouter.put('/:vehicle/owner', async (req: Request, res: Response) => {
  const { user } = (req as JWTRequest);
  const transactions = new Transactions(user.walletKey, fabricProxy);

  const body = req.body as {owner: string};

  try {
    const response = await transactions.changeOwner(req.params.vehicle, body.owner);

    res.send(response);
  } catch (err) {
    res.status(500);
    res.send('Error updating vehicle owner ' + (err as Error).message);
  }
});

//////////// UPDATE OWNER /////////////////
// put /api/v1/:vehicle/owner/confirm
protectedRoutesRouter.put('/:vehicle/owner/confirm', async (req: Request, res: Response) => {
  const { user } = (req as JWTRequest);
  const transactions = new Transactions(user.walletKey, fabricProxy);

  try {
    const response = await transactions.confirmOwner(req.params.vehicle);

    res.send(response);
  } catch (err) {
    res.status(500);
    res.send('Error confirming ownership ' + (err as Error).message);
  }
});

//////////// GET LOGGED IN USER CARS /////////////////
// GET /api/v1/user/vehicles
protectedRoutesRouter.get('/user/vehicles', async (req: Request, res: Response) => {
  const { user } = (req as JWTRequest);
  const transactions = new Transactions(user.walletKey, fabricProxy);

  try {
    const response = await transactions.getCallerVehicles();

    res.send(response);
  } catch (err) {
    res.status(500);
    res.send('Error retrieving caller vehicles ' + (err as Error).message);
  }
});

//////////// GET SPECIFIC USER CARS /////////////////
// GET /api/v1/:user/vehicles
protectedRoutesRouter.get('/:user/vehicles', async (req: Request, res: Response) => {
  const { user } = (req as JWTRequest);
  const transactions = new Transactions(user.walletKey, fabricProxy);

  try {
    const response = await transactions.queryByOwner(req.params.user);

    res.send(response);
  } catch (err) {
    res.status(500);
    res.send('Error retrieving specific user vehicles ' + (err as Error).message);
  }
});