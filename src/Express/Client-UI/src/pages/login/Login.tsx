import { PageContent } from '../../components';
import React, { Fragment } from 'react';
import './login.scss';

interface LoginProps
{
  onLogin(user: string, token: string, expiresIn: number): void;
}

interface LoginState
{
  userId: string;
  password: string;
}

export class Login extends React.Component<LoginProps, LoginState> {
  public constructor (props: LoginProps)
  {
    super(props);

    this.state = {
      userId: '',
      password: ''
    };
  }

  public render(): JSX.Element
  {
    const sections = [{
      title: 'sign in',
      content: (
        <Fragment >
          Sign in to DriveNet using your Application user ID and password.
          <form onSubmit={this.login.bind(this)} >
            <label>User ID:</label>
            <input type="text" onChange={this.handleUserIdChange.bind(this)} />

            <label>User password:</label>
            <input type="password" onChange={this.handlePasswordChange.bind(this)} />

            <button type="submit">
              Sign in
            </button>
          </form>
          <p>Forgotten your credentials or have yet to get them? Head over to <a href="https://fabnetworks.org/registries/default/networks/DriveNet" >FabNetworks.org</a> and follow the instructions to join DriveNet.</p>
        </Fragment>
      )
    }];

    return (
      <div className="login-component" >
        <PageContent sections={sections} small />
      </div>
    );
  }

  private handleUserIdChange(e: React.ChangeEvent<HTMLInputElement>): void
  {
    this.setState({
      userId: e.currentTarget.value
    });
  }


  private handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>): void
  {
    this.setState({
      password: e.currentTarget.value
    });
  }

  private async login(e: React.FormEvent<HTMLFormElement>): Promise<void>
  {
    e.preventDefault();

    const response = await fetch('/api/v1/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        enrollmentUserId: this.state.userId,
        enrollmentSecret: this.state.password
      })
    });

    if (!response.status.toString().startsWith('2')) {
      alert('Login failure. Are you sure the user ID and password are correct?');
      // This alert is OK without a reload
    } else {
      const { token, expiresIn } = await response.json() as {token: string; expiresIn: number };
      this.props.onLogin(this.state.userId, token, expiresIn);
    }
  }
}
