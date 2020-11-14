import React, { Fragment } from 'react';
import { PageContent, Table, Popup } from '../../components';
import { PopupType } from '../../components/popup/Popup';
import { ColumnProps, DataProps, FilterType } from '../../components/table/Table';
import './overview.scss';
import { VehicleDetails, VehicleStatus } from '../../utils/defs';
import { CarNumberSort, RequestWithAuthHandler } from '../../utils/functions';

type TableColumnAccessors = 'carNumber' | 'make' | 'model' | 'colour';
const tableColumns: ColumnProps<TableColumnAccessors>[] = [{ accessor: 'carNumber', display: 'car number', contentWidth: true, customSort: CarNumberSort, primaryKey: true }, { accessor: 'make' }, { accessor: 'model' }, { accessor: 'colour' }];

type YourVehicleTableAccessors = 'status' | TableColumnAccessors;
const YourVehicleTableColumns = ([] as ColumnProps<YourVehicleTableAccessors>[]).concat(tableColumns).concat({ accessor: 'status', filter: FilterType.Select });

type NetworkVehicleTableAccessors = 'owner' | TableColumnAccessors;
const NetworkVehicleTableColumns = ([] as ColumnProps<NetworkVehicleTableAccessors>[]).concat(tableColumns).concat({ accessor: 'owner', filter: FilterType.MultipleChoiceSelect });

const PendingUserVehicleTableData: DataProps<YourVehicleTableAccessors>[] = [{
    carNumber: '██████',
    make: '████',
    model: '███████',
    colour: '███',
    status: '█████'
}, {
    carNumber: '██████',
    make: '██████',
    model: '██████',
    colour: '█████',
    status: '█████'
}, {
    carNumber: '██████',
    make: '██████',
    model: '█████',
    colour: '████',
    status: '█████'
}];

const PendingNetworkVehicleTableData: DataProps<NetworkVehicleTableAccessors>[] = [{
    carNumber: '█████',
    make: '████████',
    model: '█ █████',
    colour: '██████',
    owner: '████'
}, {
    carNumber: '██████',
    make: '████',
    model: '██████',
    colour: '████',
    owner: '███████'
}, {
    carNumber: '█████',
    make: '█████',
    model: '█████ █',
    colour: '████ ████',
    owner: '███'
}, {
    carNumber: '██████',
    make: '████',
    model: '██',
    colour: '████',
    owner: '████'
}, {
    carNumber: '██████',
    make: '████',
    model: '██',
    colour: '████',
    owner: '█████'
}];

interface OverviewProps {
    onRequestVehicleDetails(vehicle: VehicleDetails): void;
    userVehicles?: VehicleDetails[];
    networkVehicles?: VehicleDetails[];
    currentUser: string;
    currentUserToken: string;
    onRequestTokenRefresh(logout: boolean): Promise<string>;
}

interface OverviewState {
    showCreateVehicle: boolean;
    createVehicleForm: {
        id: string;
        make: string;
        model: string;
        colour: string;
        owner: string;
    };
}

export class Overview extends React.Component<OverviewProps, OverviewState> {
    constructor(props: OverviewProps) {
        super(props);

        this.state = {
            showCreateVehicle: false,
            createVehicleForm: {
                id: '',
                make: '',
                model: '',
                colour: '',
                owner: ''
            }
        }
    }

    public render(): JSX.Element {
        const sections = [{
            title: 'cars assigned to you',
            content: this.renderYourVehicles()
        }, {
            title: 'network cars',
            content: this.renderNetworkVehicles()
        }];

        return (
            <Fragment>
                {this.renderCreateVehiclePopup()}
                <PageContent sections={sections} />
            </Fragment>
        );
    }

    private renderYourVehicles(): JSX.Element {
        let userVehicles: DataProps<YourVehicleTableAccessors>[] = PendingUserVehicleTableData;
        
        if (this.loaded()) {
            userVehicles = (this.props.userVehicles as VehicleDetails[]).map((vehicle) => {
                return {
                    carNumber: vehicle.key,
                    make: vehicle.car.make,
                    model: vehicle.car.model,
                    colour: vehicle.car.color,
                    status: vehicle.status === VehicleStatus.AwaitingNewOwner && !/fabric_user_[0-9]{4}/.exec(vehicle.car.owner) ? `Owned by ${vehicle.car.owner}` : vehicle.status
                }
            });
        }

        const onClick = this.loaded() ? (carID: string) => this.handleRowClick(carID, 'userVehicles') : undefined;

        return (
            <div className="yourVehicles">
                <Table<YourVehicleTableAccessors> disableActions={!this.loaded()} flashContent={!this.loaded()} columns={YourVehicleTableColumns} data={userVehicles} onRowClick={onClick} />
                <button className="secondary" disabled={!this.loaded()} onClick={this.showCreateVehiclePopup.bind(this)} >
                    Create Car
                </button>
            </div>
        )
    }

    private renderNetworkVehicles(): JSX.Element {
        let networkVehicles: DataProps<NetworkVehicleTableAccessors>[] = PendingNetworkVehicleTableData;
        
        if (this.loaded()) {
            networkVehicles = (this.props.networkVehicles as VehicleDetails[]).map((vehicle) => {
                return {
                    carNumber: vehicle.key,
                    make: vehicle.car.make,
                    model: vehicle.car.model,
                    colour: vehicle.car.color,
                    owner: vehicle.car.owner
                }
            });
        }

        const onClick = this.loaded() ? (carID: string) => this.handleRowClick(carID, 'networkVehicles') : undefined;

        return (
            <Table<NetworkVehicleTableAccessors> disableActions={!this.loaded()} flashContent={!this.loaded()} columns={NetworkVehicleTableColumns} data={networkVehicles} onRowClick={onClick} />
        )
    }

    private renderCreateVehiclePopup(): JSX.Element {
        const content = (
            <form id="createVehicleForm" onSubmit={this.createVehicle.bind(this)} className="createVehicleForm" >
                <label>ID:</label>
                <input type="text" onChange={(e) => this.handleFormEntry(e, 'id')} value={this.state.createVehicleForm.id} />
                <label>Make:</label>
                <input type="text" onChange={(e) => this.handleFormEntry(e, 'make')} value={this.state.createVehicleForm.make} />
                <label>Model:</label>
                <input type="text" onChange={(e) => this.handleFormEntry(e, 'model')} value={this.state.createVehicleForm.model} />
                <label>Colour:</label>
                <input type="text" onChange={(e) => this.handleFormEntry(e, 'colour')} value={this.state.createVehicleForm.colour} />
                <label>Owner:</label>
                <input type="text" onChange={(e) => this.handleFormEntry(e, 'owner')} value={this.state.createVehicleForm.owner} />
            </form>
        );

        return (
            <Popup title="create car" content={content} popupType={PopupType.CancelSubmit}
                form="createVehicleForm"
                display={this.state.showCreateVehicle} 
                onSecondary={() => this.setState({showCreateVehicle: false})}
            />
        )
    }

    private showCreateVehiclePopup() {
        let carId = 'CAR9999';

        if (this.props.networkVehicles) {
            let offset = 11; // skip protected values

            const ids = this.props.networkVehicles.map((vehicle) => {
                return Number.parseInt(vehicle.key.replace('CAR', ''), 10);
            }).sort((a, b) => {
                return a - b;
            }).filter((a) => a >= offset);

            // Find lowest unused ID
            let lowest = -1;
            for (let i = 0; i < 10000 - offset; i++) {
                if (i + offset !== ids[i]) {
                    lowest = i + offset;
                    break;
                }
            }

            if (lowest !== -1) {
                carId = 'CAR' + lowest
            }
        }

        const obj: {[K in keyof OverviewState['createVehicleForm']]?: string} = {};
        obj.id = carId;
        obj.owner = this.props.currentUser;

        this.setState({
            showCreateVehicle: true,
            createVehicleForm: Object.assign(this.state.createVehicleForm, obj)
        });
    }

    private handleFormEntry(e: React.ChangeEvent<HTMLInputElement>, type: keyof OverviewState['createVehicleForm']) {
        const obj: {[K in keyof OverviewState['createVehicleForm']]?: string} = {};
        obj[type] = e.currentTarget.value;

        this.setState({
            createVehicleForm: Object.assign(this.state.createVehicleForm, obj)
        });
    }

    private async createVehicle(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            await RequestWithAuthHandler(`/api/v1/vehicles`, this.props.currentUserToken, this.props.onRequestTokenRefresh, 'POST', {
                carNumber: this.state.createVehicleForm.id,
                make: this.state.createVehicleForm.make,
                model: this.state.createVehicleForm.model,
                colour: this.state.createVehicleForm.colour,
                owner: this.state.createVehicleForm.owner,
            });

            window.location.reload();
        } catch (err) {
            console.log(err);
            alert('Unable to create vehicle: ' + err.message);
            window.location.reload();
        }
    }

    private handleRowClick(carID: string, table: 'userVehicles' | 'networkVehicles') {
        if (this.loaded()) {
            const data = (this.props[table] as VehicleDetails[]).find((row) => row.key === carID) as VehicleDetails;

            this.props.onRequestVehicleDetails(data);
        }
    }

    private loaded(): boolean {
        if (this.props.networkVehicles && this.props.userVehicles) {
            return true;
        }

        return false;
    }
}
