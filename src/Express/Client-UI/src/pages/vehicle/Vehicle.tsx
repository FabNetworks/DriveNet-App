import { VehicleOwner } from '../../../../../Utils/defs';
import { Dropdown, PageContent, Popup, Table } from '../../components';
import { PopupType } from '../../components/popup/Popup';
import { ColumnProps, DataProps, DateString } from '../../components/table/Table';
import { VehicleDetails, VehicleStatus } from '../../utils/defs';
import { RequestWithAuthHandler } from '../../utils/functions';
import React, { Fragment } from 'react';
import './vehicle.scss';


type HistoryTableColumnAccessors = 'owner' | 'from' | 'to';
const HistoryTableColumns: ColumnProps<HistoryTableColumnAccessors>[] = [{ accessor: 'owner', keepTextFormat: true }, { accessor: 'from', contentFormat: 'date' }, { accessor: 'to', contentFormat: 'date' }];
const PendingHistoryTableData: DataProps<HistoryTableColumnAccessors>[] = [{
  owner: '████████████████',
  from: DateString.Pending,
  to: DateString.Pending,
}, {
  owner: '████████████████',
  from: DateString.Pending,
  to: DateString.Pending,
}, {
  owner: '████████████████',
  from: DateString.Pending,
  to: DateString.Pending,
}];

interface VehicleProps
{
  onRequestOverview(): void;
  vehicle: VehicleDetails;
  currentUser: string;
  currentUserToken: string;
  onRequestTokenRefresh(logout: boolean): Promise<string>;
}

interface VehicleState
{
  loaded: boolean;
  previousOwners: DataProps<HistoryTableColumnAccessors>[];
  showNewOwner: boolean;
  showDeleteVehicle: boolean;
  newOwner: string;
}

export class Vehicle extends React.Component<VehicleProps, VehicleState> {
  public constructor (props: VehicleProps)
  {
    super(props);

    this.state = {
      loaded: false,
      previousOwners: PendingHistoryTableData,
      newOwner: '',
      showNewOwner: false,
      showDeleteVehicle: false
    };
  }

  public render(): JSX.Element
  {
    const sections = [{
      title: this.props.vehicle.car.make + ' ' + this.props.vehicle.car.model,
      content: this.renderVehicleDetails(),
      dropdown: this.props.vehicle.car.certOwner === this.props.currentUser ?
        <Dropdown title="actions" choices={[{ name: 'change owner', action: this.showNewOwnerPopup.bind(this) }, { name: 'delete car', action: this.showDeleteVehiclePopup.bind(this) }]} /> :
        this.props.vehicle.car.owner === this.props.currentUser ?
          <Dropdown title="actions" choices={[{ name: 'confirm ownership', action: this.confirmOwnership.bind(this) }]} /> :
          undefined
    }, {
      title: 'ownership history',
      content: this.renderOwnershipHistory()
    }];

    return (
      <Fragment>
        {this.renderNewOwnerPopup()}
        {this.renderDeleteVehiclePopup()}
        <PageContent onBack={this.props.onRequestOverview} sections={sections} />
      </Fragment>
    );
  }

  public async componentDidMount(): Promise<void>
  {
    await this.getHistory();
  }

  private renderVehicleDetails(): JSX.Element
  {
    return (
      <table className="vehicleDetails" >
        <tbody>
          <tr>
            <td>ID:</td>
            <td>{this.props.vehicle.key}</td>
          </tr>
          <tr>
            <td>Make:</td>
            <td>{this.props.vehicle.car.make}</td>
          </tr>
          <tr>
            <td>Model:</td>
            <td>{this.props.vehicle.car.model}</td>
          </tr>
          <tr>
            <td>Colour:</td>
            <td>{this.props.vehicle.car.color}</td>
          </tr>
          <tr>
            <td>Current Owner:</td>
            <td>{this.props.vehicle.car.owner}{this.renderStatus()}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  private renderStatus(): string
  {
    const vehicle = this.props.vehicle;

    if (vehicle.status === VehicleStatus.AwaitingNewOwner && !/fabric_user_[0-9]{4}/.exec(vehicle.car.owner)) {
      return '';
    }

    switch (vehicle.status) { /* eslint-disable indent */
      case VehicleStatus.NoRelationToUser:
      case VehicleStatus.OwnedByUser: return '';
      case VehicleStatus.AwaitingNewOwner:
      case VehicleStatus.PendingCurrentUser: return ` (${this.props.vehicle.status})`;
    } /* eslint-enable indent */
  }

  private renderOwnershipHistory(): JSX.Element
  {
    return (
      <Table<HistoryTableColumnAccessors> disableActions={!this.state.loaded} flashContent={!this.state.loaded} columns={HistoryTableColumns} data={this.state.previousOwners} />
    );
  }

  private renderNewOwnerPopup(): JSX.Element
  {
    const content = (
      <form id="changeOwnerForm" onSubmit={this.changeOwner.bind(this)} className="changeOwnerForm" >
        <label>New owner:</label>
        <input type="text" onChange={this.handleOwnerEntry.bind(this)} value={this.state.newOwner} />
      </form>
    );

    return (
      <Popup title="change owner" content={content} popupType={PopupType.CancelSubmit}
        form="changeOwnerForm"
        display={this.state.showNewOwner}
        onSecondary={(): void => this.setState({ showNewOwner: false })}
      />
    );
  }

  private renderDeleteVehiclePopup(): JSX.Element
  {
    return (
      <Popup title="delete car?" content={`Are you sure you wish to delete ${this.props.vehicle.key}?`}
        popupType={PopupType.YesNo} display={this.state.showDeleteVehicle}
        onPrimary={this.deleteVehicle.bind(this)}
        onSecondary={(): void => this.setState({ showDeleteVehicle: false })}
      />
    );
  }

  private showNewOwnerPopup(): void
  {
    this.setState({
      showNewOwner: true
    });
  }

  private showDeleteVehiclePopup(): void
  {
    this.setState({
      showDeleteVehicle: true
    });
  }

  private async getHistory(): Promise<void>
  {
    try {
      const previousOwners: VehicleOwner[] = await RequestWithAuthHandler(`/api/v1/${this.props.vehicle.key}/history`, this.props.currentUserToken, this.props.onRequestTokenRefresh); // eslint-disable-line @typescript-eslint/no-unsafe-assignment

      if (previousOwners) {
        const previousOwnersTableData: DataProps<HistoryTableColumnAccessors>[] = previousOwners.map((previousOwner) =>
        {
          if (!previousOwner.to) {
            previousOwner.to = DateString.Present;
          }

          return previousOwner as DataProps<HistoryTableColumnAccessors>;
        });

        this.setState({
          loaded: true,
          previousOwners: previousOwnersTableData.sort((a, b) => a.to > b.to ? -1 : a.to === b.to ? 0 : 1)
        });
      } else {
        this.setState({
          loaded: false,
          previousOwners: PendingHistoryTableData
        });
      }
    } catch (err) {
      alert('Failed to get history for car');
      window.location.reload();
    }
  }

  private handleOwnerEntry(e: React.ChangeEvent<HTMLInputElement>): void
  {
    this.setState({
      newOwner: e.currentTarget.value
    });
  }

  private async changeOwner(e: React.FormEvent<HTMLFormElement>): Promise<void>
  {
    e.preventDefault();

    try {
      await RequestWithAuthHandler(`/api/v1/${this.props.vehicle.key}/owner`, this.props.currentUserToken, this.props.onRequestTokenRefresh, 'PUT', {
        owner: this.state.newOwner
      });

      window.location.reload();
    } catch (err) {
      console.log(err);

      alert('Unable to change ownership of car');
      window.location.reload();
    }
  }

  private async confirmOwnership(): Promise<void>
  {
    try {
      await RequestWithAuthHandler(`/api/v1/${this.props.vehicle.key}/owner/confirm`, this.props.currentUserToken, this.props.onRequestTokenRefresh, 'PUT');

      window.location.reload();
    } catch (err) {
      console.log(err);

      alert('Unable to confirm ownership of car');
      window.location.reload();
    }
  }

  private async deleteVehicle(): Promise<void>
  {
    try {
      await RequestWithAuthHandler(`/api/v1/${this.props.vehicle.key}`, this.props.currentUserToken, this.props.onRequestTokenRefresh, 'DELETE');

      window.location.reload();
    } catch (err) {
      console.log(err);

      alert('Unable to delete car');
      window.location.reload();
    }
  }
}
