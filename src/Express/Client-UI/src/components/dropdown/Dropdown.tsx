import React from 'react';
import './dropdown.scss';

interface DropdownProps
{
  title: string;
  keepTextFormat?: boolean;
  choices: { name: string; action: () => void }[];
}

interface DropdownState
{
  showingMenu: boolean;
  id: string;
}

export class Dropdown extends React.Component<DropdownProps, DropdownState> {
  public constructor (props: DropdownProps)
  {
    super(props);

    this.state = {
      showingMenu: false,
      id: Math.random().toString(36).substr(2, 9)
    };
  }

  public render(): JSX.Element
  {
    return (
      <div className={`dropdown-component ${this.state.showingMenu ? 'show' : ''} ${this.props.keepTextFormat ? 'lowercase' : ''}`} >
        <span id={this.state.id} tabIndex={0} onKeyPress={(e): void => this.keyListener(e, this.showMenu.bind(this))} onClick={(): void => this.showMenu()} >{this.props.title}</span>
        <ul>
          {this.props.choices.map((choice) => <li key={choice.name} tabIndex={0} onKeyPress={(e): void => this.keyListener(e, choice.action)} onClick={choice.action} >{choice.name}</li>)}
        </ul>
      </div>
    );
  }

  private keyListener(e: React.KeyboardEvent, action: () => void): void
  {
    if (e.key === 'Enter') {
      action();
    }
  }

  private showMenu(addListener = true): void
  {
    this.setState({
      showingMenu: !this.state.showingMenu
    });

    const addOutsideListener = (e: MouseEvent | KeyboardEvent): void =>
    {
      const spanElement = document.getElementById(this.state.id);

      if (e.target !== spanElement) {
        this.showMenu(false);

        window.removeEventListener('click', addOutsideListener);
        window.removeEventListener('keypress', addOutsideListener);
      }
    };

    if (addListener) {
      setTimeout(() =>
      {
        window.addEventListener('click', addOutsideListener);
        window.addEventListener('keypress', addOutsideListener);
      }, 50);
    }
  }
}
