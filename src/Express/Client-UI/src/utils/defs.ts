import { Vehicle } from '../../../../Utils/defs';

export enum VehicleStatus {
    NoRelationToUser = 'no relation to user',
    OwnedByUser = 'owned',
    AwaitingNewOwner = 'awaiting new owner',
    PendingCurrentUser = 'pending your confirmation'
}

export interface VehicleDetails extends Vehicle {
    status: VehicleStatus
}