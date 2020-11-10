import React from 'react';
import './select.scss';

interface SelectProps {
    choices: (string | number)[];
    onSelect(choice: string | number): void;
}

interface SelectState {
    showingMenu: boolean;
    ulOverflowing: boolean;
    id: string;
    selected: string | number;
}

export class Select extends React.Component<SelectProps, SelectState> {
    private ulRef: React.RefObject<HTMLUListElement>;
    private selectedRef: React.RefObject<HTMLSpanElement>;
    private readonly canvasContext: CanvasRenderingContext2D;

    constructor(props: SelectProps) {
        super(props);

        this.ulRef = React.createRef<HTMLUListElement>();
        this.selectedRef = React.createRef<HTMLSpanElement>();

        this.state = {
            showingMenu: false,
            ulOverflowing: false,
            id: Math.random().toString(36).substr(2, 9),
            selected: this.props.choices[0]
        };

        const canvas = document.createElement('canvas');

        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        context.font = '10.5px  Montserrat';

        this.canvasContext = context;
    }

    render(): JSX.Element {
        return (
            <div className={`select-component ${this.state.showingMenu ? 'show' : ''}`} >
                <span ref={this.selectedRef} id={this.state.id} tabIndex={0} className="selected" onKeyPress={(e) => this.handleKeyPress(e, this.showMenu.bind(this))} onClick={() => this.showMenu()} >{this.state.selected}</span>
                <div className="choices" >
                    <ul ref={this.ulRef} className={`${this.state.ulOverflowing ? 'overflowing' : ''}`} >
                        { this.props.choices.map((choice) => {
                            return (
                                <li key={choice} tabIndex={0} onClick={() => this.handleSelect(choice)} onKeyPress={(e) => this.handleKeyPress(e, () => this.handleSelect(choice))} >
                                    {choice}
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        )
    }

    componentDidMount() {
        this.handleUlSizing();
    }

    componentDidUpdate(previousProps: SelectProps) {
        // check if the overflow is occurring so we can handle tick positioning based on scrollbar, only want to run when visible is changed
        if (JSON.stringify(this.props.choices) !== JSON.stringify(previousProps.choices)) {
            this.handleUlSizing();
        }
    }

    private handleUlSizing() {
        if(this.ulRef.current && this.selectedRef.current) {
            const el: HTMLUListElement = this.ulRef.current;

            var isOverflowing = el.clientHeight < el.scrollHeight;    

            this.setState({
                ulOverflowing: isOverflowing
            });

            const longest = this.props.choices.reduce((a, b) => a.toString().length > b.toString().length ? a : b);
            const textWidth = this.canvasContext.measureText(longest.toString()).width;
            
            this.selectedRef.current.style.minWidth = (textWidth + 44) + 'px';
            this.ulRef.current.style.minWidth = (textWidth + 40) + 'px';
        }
    }

    private handleKeyPress(e: React.KeyboardEvent, action: () => void) {
        if (e.key === 'Enter') {
            action();
        }
    }

    private showMenu(addListener: boolean = true): void {
        this.setState({
            showingMenu: !this.state.showingMenu
        });

        const addOutsideListener = (e: MouseEvent | KeyboardEvent) => {           
            const targetId = (e.target as any).id as string | undefined;

            if (!targetId || !targetId.startsWith(this.state.id)) {
                this.showMenu(false);

                window.removeEventListener('click', addOutsideListener);
                window.removeEventListener('keypress', addOutsideListener);
            }
        };

        if (addListener) {
            setTimeout(() => {
                window.addEventListener('click', addOutsideListener);
                window.addEventListener('keypress', addOutsideListener);
            }, 50);
        }
    }

    private handleSelect(choice: string | number) {
        this.setState({
            selected: choice
        });

        this.props.onSelect(choice);
    }
}