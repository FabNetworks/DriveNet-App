import { Request } from 'express';

export interface JWTContents {
    userId: string,
    walletKey: string
}

export interface JWTRequest extends Request {
    user: JWTContents
}

export interface Vehicle {
    key: string;
    car: {
        color: string;
        make: string;
        model: string;
        owner: string;
        certOwner: string;
    }
}

export interface SCPreviousOwnersNoChange {
    previousOwnerCount: number;
    previousOwners?: string[];
    previousOwnershipChangeDates?: string[];
    currentOwner: string;
    currentOwnershipChangeDate: string;
}

export interface SCPreviousOwners extends SCPreviousOwnersNoChange {
    previousOwners: string[];
    previousOwnershipChangeDates: string[];
}

export interface VehicleOwner {
    owner: string;
    from: number;
    to?: number;
}
