import { SCPreviousOwners, SCPreviousOwnersNoChange, Vehicle, VehicleOwner } from '../Utils/defs';

import { FabricProxy } from '../Utils/FabricProxy';

// TODO call new Transaction with user creds from express
export class Transactions {
  constructor(private readonly walletKey: string, private readonly fabricProxy: FabricProxy) {}

  public async createVehicle(carNumber: string, make: string, model: string, colour: string, owner: string): Promise<void> {
    await this.fabricProxy.submit('createCar', [carNumber, make, model, colour, owner], this.walletKey);
  }

  public async deleteVehicle(carNumber: string): Promise<void> {
    await this.fabricProxy.submit('deleteCar', [carNumber], this.walletKey);
  }

  public async changeOwner(carNumber: string, owner: string): Promise<void> {
    await this.fabricProxy.submit('changeCarOwner', [carNumber, owner], this.walletKey);
  }

  public async confirmOwner(carNumber: string): Promise<void> {
    await this.fabricProxy.submit('confirmTransfer', [carNumber], this.walletKey);
  }


  public async getCallerVehicles(): Promise<Vehicle[]> {
    const response: Buffer = await this.fabricProxy.evaluateWithTransient('findMyCars', [], {QueryOutput: Buffer.from('all')}, this.walletKey);

    return this.formatVehicles(JSON.parse(response.toString()));
  }

  public async queryAllCars(): Promise<Vehicle[]> {
    const response: Buffer = await this.fabricProxy.evaluateWithTransient('queryAllCars', [], {QueryOutput: Buffer.from('all')}, this.walletKey);

    return this.formatVehicles(JSON.parse(response.toString()));
  }

  public async queryByOwner(owner: string): Promise<Vehicle[]> {
    const response: Buffer = await this.fabricProxy.evaluateWithTransient('queryByOwner', [owner], {QueryOutput: Buffer.from('all')}, this.walletKey);

    return this.formatVehicles(JSON.parse(response.toString()));
  }

  public async getPreviousOwners(carNumber: string): Promise<VehicleOwner[]> {
    const response: Buffer = await this.fabricProxy.evaluate('getPreviousOwners', [carNumber], this.walletKey);

    return this.formatPreviousOwners(JSON.parse(response.toString()));
  }

  private formatVehicles(vehicles: Vehicle[]): Vehicle[] {
    return vehicles.map((vehicle) => {
      const certOwnerMatches = /x509::\/OU=(admin|client)\/CN=(.*)::/.exec(vehicle.car.certOwner);

      vehicle.car.certOwner = certOwnerMatches ? certOwnerMatches[2] : vehicle.car.certOwner;

      return vehicle;
    });
  }

  private formatPreviousOwners(previousOwners: SCPreviousOwners | SCPreviousOwnersNoChange): VehicleOwner[] {
    console.log('RAW', JSON.stringify(previousOwners));

    const formatted: VehicleOwner[] = previousOwners.previousOwners?.map((previousOwner, index) => {
      const previousOwnersDates = (previousOwners as SCPreviousOwners).previousOwnershipChangeDates;

      return {
        owner: previousOwner,
        from: new Date(previousOwnersDates[index]).getTime(),
        to: index === 0 ? new Date(previousOwners.currentOwnershipChangeDate).getTime() : new Date(previousOwnersDates[index - 1]).getTime()
      };
    }) || [];

    formatted.unshift({
      owner: previousOwners.currentOwner,
      from: new Date(previousOwners.currentOwnershipChangeDate).getTime()
    });

    console.log('FORMATTED', JSON.stringify(formatted.map((format) => {
      return {
        owner: format.owner,
        from: new Date(format.from),
        to: format.to ? new Date(format.to) : ''
      };
    })));

    return formatted;
  }
}