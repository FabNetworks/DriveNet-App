import React from 'react';
import './multipleChoiceSelect.scss';

interface MultipleChoiceSelectProps
{
  choices: React.ReactText[];
  onSelect(choice: string | number): void;
  onDeselect(choice: string | number): void;
}

interface MultipleChoiceSelectState
{
  showingMenu: boolean;
  searchText: string;
  selected: (string | number)[];
  id: string;
  ulOverflowing: boolean;
}

export class MultipleChoiceSelect extends React.Component<MultipleChoiceSelectProps, MultipleChoiceSelectState> {
  private ulRef: React.RefObject<HTMLUListElement>;
  private selectedRef: React.RefObject<HTMLSpanElement>;
  private readonly canvasContext: CanvasRenderingContext2D;

  public constructor (props: MultipleChoiceSelectProps)
  {
    super(props);

    this.ulRef = React.createRef<HTMLUListElement>();
    this.selectedRef = React.createRef<HTMLUListElement>();

    this.state = {
      showingMenu: false,
      searchText: '',
      selected: [],
      id: Math.random().toString(36).substr(2, 9),
      ulOverflowing: false
    };

    const canvas = document.createElement('canvas');

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.font = '10.5px  Montserrat';

    this.canvasContext = context;
  }

  public render(): JSX.Element
  {
    return (
      <div className={`multipleChoiceSelect-component ${this.state.showingMenu ? 'show' : ''}`} >
        <span ref={this.selectedRef} id={this.state.id} tabIndex={0} className="selected" onKeyPress={(e): void => this.handleKeyPress(e, this.showMenu.bind(this))} onClick={(): void => this.showMenu()} >{this.state.selected.length === 0 ? 'Any' : this.state.selected.length === 1 ? this.state.selected[0] : 'Multiple'}</span>
        <div className="choices" >
          <input id={`${this.state.id}-searchText`} type="text" placeholder="search" onChange={(e): void => this.setState({ searchText: e.currentTarget.value })} value={this.state.searchText} />
          <ul ref={this.ulRef} className={`${this.state.ulOverflowing ? 'overflowing' : ''}`} >
            {this.props.choices.filter((choice) => choice.toString().toLowerCase().startsWith(this.state.searchText.toLowerCase())).map((choice) =>
            {
              return (
                <li id={`${this.state.id}-${String(choice)}`} key={choice} tabIndex={0} onKeyPress={(e): void => this.handleKeyPress(e, () => this.handleSelect(!this.state.selected.includes(choice), choice))} >
                  <input type="checkbox" id={`${this.state.id}-${String(choice)}-checkbox`} onChange={(e): void => this.handleSelect(e.currentTarget.checked, choice)} checked={this.state.selected.includes(choice)} />
                  <label id={`${this.state.id}-${String(choice)}-label`} htmlFor={`${this.state.id}-${String(choice)}-checkbox`} >{choice}</label>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  public componentDidMount(): void
  {
    this.handleUlSizing();
  }

  public componentDidUpdate(previousProps: MultipleChoiceSelectProps): void
  {
    if (this.props.choices.length !== previousProps.choices.length) {
      this.handleUlSizing();
    }
  }

  private handleUlSizing(): void
  {
    if (this.ulRef.current && this.selectedRef.current) {
      const el: HTMLUListElement = this.ulRef.current;

      const isOverflowing = el.clientHeight < el.scrollHeight;

      this.setState({
        ulOverflowing: isOverflowing
      });

      const longest = this.props.choices.reduce((a, b) => a.toString().length > b.toString().length ? a : b);
      const textWidth = Math.max(this.canvasContext.measureText(longest.toString()).width, 130); // 130 to allow for textbox at width 140 - padding

      this.selectedRef.current.style.minWidth = (textWidth + 44) + 'px';
      this.ulRef.current.style.minWidth = (textWidth + 40) + 'px';
    }
  }

  private handleKeyPress(e: React.KeyboardEvent, action: () => void): void
  {
    if (e.key === 'Enter') {
      action();
    }
  }

  private showMenu(addListener = true): void
  {
    this.setState({
      searchText: '',
      showingMenu: !this.state.showingMenu
    });

    const addOutsideListener = (e: MouseEvent | KeyboardEvent): void =>
    {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      const targetId = (e.target as any).id as string | undefined;

      if (!targetId || !targetId.startsWith(this.state.id)) {
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

  private handleSelect(checked: boolean, choice: string | number): void
  {
    let selected = ([] as (string | number)[]).concat(this.state.selected);

    if (checked) {
      selected.push(choice);

      this.props.onSelect(choice);
    } else {
      selected = selected.filter((selectedValue) => selectedValue !== choice);

      this.props.onDeselect(choice);
    }

    this.setState({
      selected
    });
  }
}
