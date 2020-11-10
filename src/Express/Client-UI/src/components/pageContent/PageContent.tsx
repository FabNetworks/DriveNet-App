import React from 'react';
import { Dropdown } from '../dropdown/Dropdown';
import './pageContent.scss';

interface PageContentProps {
    small?: boolean;
    sections: {title: string, content: JSX.Element, dropdown?: React.ReactElement<Dropdown>}[]
    onBack?(): void;
}

export class PageContent extends React.Component<PageContentProps> {
    public render(): JSX.Element {
        return (
            <div className={`pageContent-component ${this.props.small ? 'small' : ''}`} >
                { this.props.onBack && 
                  <div className="navigation" onClick={this.props.onBack} tabIndex={0} onKeyPress={this.handleKeyPress.bind(this)} >
                      <img src={process.env.PUBLIC_URL + '/icons/arrow-left.svg'} alt="Go back to overview" />
                  </div>
                }
                {this.props.sections.map((section) => {
                    return (
                        <section key={`${section.title}-section`}>
                            <div className='sectionHeader' >
                                <h2>{section.title}</h2>
                                {section.dropdown}
                            </div>
                            {section.content}
                        </section>
                    )
                })}
            </div>
        )
    }

    public handleKeyPress(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === 'Enter') {
            (this.props.onBack as () => void)();
        }
    }
}