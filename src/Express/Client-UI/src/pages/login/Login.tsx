import React, { Fragment } from 'react';
import { PageContent } from '../../components';
import './login.scss';

interface LoginProps {
    onLogin(user: string, token: string, expiresIn: number): void;
}

interface LoginState {
    userId: string;
    password: string;
}

export class Login extends React.Component<LoginProps, LoginState> {

    constructor(props: LoginProps) {
        super(props);

        this.state = {
            userId: '',
            password: ''
        }
    }

    public render(): JSX.Element {
        const sections = [{
            title: 'sign in',
            content: (
                <Fragment >
                    Sign in to DriveNet using your user ID and password.
                    <form onSubmit={this.login.bind(this)} >
                        <label>User ID:</label>
                        <input type="text" onChange={this.handleUserIdChange.bind(this)} />

                        <label>User password:</label>
                        <input type="password" onChange={this.handlePasswordChange.bind(this)} />

                        <button type="submit">
                            Sign in
                        </button>
                    </form>
                    <p>Forgotten your credentials or have yet to get them? Head over to <a href="https://fabnetworks.org/networks/drivenet" >FabNetworks.org</a> and follow the instructions to join DriveNet.</p>
                </Fragment>
            )
        }];

        return (
            <div className="login-component" >
                <PageContent sections={sections} small />
            </div>
        );
    }

    private handleUserIdChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            userId: e.currentTarget.value
        });
    }


    private handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            password: e.currentTarget.value
        });
    }

    private async login(e: React.FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();

        const response = await fetch(`/api/v1/login`, {
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
        }

        const { token, expiresIn} = await response.json();

        this.props.onLogin(this.state.userId, token, expiresIn);
    }
}