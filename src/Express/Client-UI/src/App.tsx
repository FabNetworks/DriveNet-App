import React from 'react';
import './app.scss';
import { Dropdown } from './components';
import { Login, Overview, Vehicle } from './pages';
import { Vehicle as VehicleDef } from '../../../Utils/defs';
import { VehicleDetails, VehicleStatus } from './utils/defs';
import { CarNumberSort, RequestWithAuthHandler } from './utils/functions';
import { withCookies, Cookies } from 'react-cookie';

enum DisplayState {
  Login,
  Home,
  Vehicle
}

interface AppProps {
  cookies: Cookies;
}

interface AppState {
  state: DisplayState;
  selectedVehicle?: VehicleDetails
  showUserList: boolean;
  userVehicles?: VehicleDetails[];
  networkVehicles?: VehicleDetails[];
  currentUser?: string;
  currentUserToken?: string;
  refreshTokenTimeout?: NodeJS.Timeout;
}

class App extends React.Component<AppProps, AppState> {

  constructor(props: AppProps) {
    super(props);

    const { cookies } = this.props;

    this.state = {
      state: cookies.get('token') ? DisplayState.Home : DisplayState.Login,
      showUserList: false,
      currentUser: cookies.get('user'),
      currentUserToken: cookies.get('token'),

    }
  }

  render() {
    return (
      <div className="app-component">
        <div className="background" ></div>
        <div className="content" >
          <header>
            <h1>DRIVENET</h1>
            {
              this.state.state !== DisplayState.Login &&
              <Dropdown keepTextFormat title={this.state.currentUser as string} choices={[{ name: 'logout', action: this.handleLogout.bind(this) }]} />
            }
          </header>
          <div className={`pageContent ${this.state.state === DisplayState.Login ? 'login' : ''}`} >
            {this.renderPageContent()}
          </div>
        </div>
      </div>
    );
  }

  public componentDidMount() {
    if (this.state.state === DisplayState.Home) {
      this.loadVehicles();
    }

    window.addEventListener('storage', (e) => {
      if (e.key === 'logout') {
        window.location.reload()
      }
    }); // if log out in another tab log this one out too
  }

  public componentDidUpdate(_: AppProps, previousState: AppState) {
    if (
      previousState.state !== DisplayState.Home && this.state.state === DisplayState.Home &&
      !this.state.networkVehicles && !this.state.userVehicles
    ) {
      this.loadVehicles();
    }
  }

  private renderPageContent() {
    switch (this.state.state) {
      case DisplayState.Login: return this.renderLogin();
      case DisplayState.Home: return this.renderHome();
      case DisplayState.Vehicle: return this.renderVehicle();
    }
  }

  private renderLogin() {
    return (
      <Login onLogin={this.handleLogin.bind(this)} />
    );
  }

  private renderHome() {
    return (
      <Overview onRequestTokenRefresh={this.refreshToken.bind(this)} currentUser={this.state.currentUser as string} currentUserToken={this.state.currentUserToken as string} userVehicles={this.state.userVehicles} networkVehicles={this.state.networkVehicles} onRequestVehicleDetails={(vehicle: VehicleDetails) => this.setState({ state: DisplayState.Vehicle, selectedVehicle: vehicle })} />
    );
  }

  private renderVehicle() {
    if (!this.state.selectedVehicle) {
      throw new Error('Cannot render vehicle without vehicle selected');
    }

    return (
      <Vehicle onRequestTokenRefresh={this.refreshToken.bind(this)} currentUser={this.state.currentUser as string} currentUserToken={this.state.currentUserToken as string} vehicle={this.state.selectedVehicle} onRequestOverview={() => this.setState({ state: DisplayState.Home })} />
    )
  }

  private handleLogin(user: string, token: string, expiresIn: number, stayOnCurrentPage: boolean = false) {
    this.props.cookies.set('token', token, {sameSite: true});
    this.props.cookies.set('user', user, {sameSite: true});

    if (this.state.refreshTokenTimeout) {
      clearTimeout(this.state.refreshTokenTimeout);
    }

    // const refreshTokenTimeout = setTimeout(async () => {
    //   this.refreshToken();
    // }, (expiresIn - 30) * 1000); // expires in is secs and we want a small buffer to make the request

    this.setState({
      state: stayOnCurrentPage ? this.state.state : DisplayState.Home,
      currentUser: user,
      currentUserToken: token,
      // refreshTokenTimeout
    });
  }

  private handleLogout() {
    this.props.cookies.remove('token');
    this.props.cookies.remove('user');

    if (this.state.refreshTokenTimeout) {
      clearTimeout(this.state.refreshTokenTimeout);
    }

    window.localStorage.setItem('logout', Date.now().toString()); 

    window.location.reload();
  }

  private async refreshToken(): Promise<string> {
    const user = this.state.currentUser as string;
    const token = this.state.currentUserToken as string;


    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + token);

    const response = await fetch(`/api/v1/refresh-token`, {headers});

    if (!response.status.toString().startsWith('2')) {
      this.handleLogout();

      return '';
    }

    const json = await response.json();

    this.handleLogin(user, json.token, json.expiresIn, true);

    return json.token;
  }

  private async loadVehicles(): Promise<void> {
    await this.loadYourVehicles();
    await this.loadNetworkVehicles();
  }

  private async loadYourVehicles(): Promise<void> {
    const currentUser = this.state.currentUser as string;
    const token = this.state.currentUserToken as string;

    try {
      const userVehicles: VehicleDef[] = await RequestWithAuthHandler('/api/v1/user/vehicles', token, this.refreshToken.bind(this));
      const ownedVehicles: VehicleDef[] = await RequestWithAuthHandler(`/api/v1/${currentUser}/vehicles`, token, this.refreshToken.bind(this));

      const yourVehiclesTableData: VehicleDetails[] = userVehicles.map((vehicle) => {
        return this.vehicleToVehicleDetails(vehicle);
      });

      ownedVehicles.forEach((vehicle) => {
        if (vehicle.car.certOwner !== currentUser && vehicle.car.owner === currentUser) {
          yourVehiclesTableData.push(this.vehicleToVehicleDetails(vehicle));
        }

        // others already found in first fetch
      });

      this.setState({
        userVehicles: yourVehiclesTableData.sort((a, b) => CarNumberSort(a.key, b.key))
      });
    } catch (err) {
      alert('Failed to retrieve user vehicles');
    }
  }

  private async loadNetworkVehicles(): Promise<void> {    
    const token = this.state.currentUserToken as string;

    try {
      const networkVehicles: VehicleDef[] = await RequestWithAuthHandler('/api/v1/vehicles', token, this.refreshToken);
  
      const networkVehiclesTableData: VehicleDetails[] = networkVehicles.map((vehicle) => {
        return this.vehicleToVehicleDetails(vehicle);
      });
  
      this.setState({
        networkVehicles: networkVehiclesTableData.sort((a, b) => CarNumberSort(a.key, b.key))
      });
    } catch(err) {
      alert('Failed to retrieve user vehicles');
    }
  }

  private vehicleToVehicleDetails(vehicle: VehicleDef): VehicleDetails {
    const currentUser = this.state.currentUser as string

    if (vehicle.car.certOwner === currentUser) {
      if (vehicle.car.owner === currentUser) {
        return Object.assign(vehicle, { status: VehicleStatus.OwnedByUser });
      }

      return Object.assign(vehicle, { status: VehicleStatus.AwaitingNewOwner });
    }

    if (vehicle.car.owner === currentUser) {
      return Object.assign(vehicle, { status: VehicleStatus.PendingCurrentUser });
    }

    return Object.assign(vehicle, { status: VehicleStatus.NoRelationToUser });
  }
}

export default withCookies(App);
