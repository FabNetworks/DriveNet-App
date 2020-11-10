import React, { Fragment } from 'react';
import { Loading } from '../loading/Loading';
import { PageContent } from '../pageContent/PageContent';
import './popup.scss';

export enum PopupType {
    YesNo,
    CancelSubmit
}

interface BasePopupProps {
    title: string
    content: string | JSX.Element;
    onSecondary(): void;
    display: boolean;
}

interface YesNoPopupProps extends BasePopupProps {
    popupType: PopupType.YesNo;
    onPrimary(): void;
}

interface CancelSubmitPopupProps extends BasePopupProps {
    popupType: PopupType.CancelSubmit;
    form: string;
    onPrimary?(): void;
}

interface PopupState {
    loading: boolean;
}

export class Popup extends React.Component<YesNoPopupProps | CancelSubmitPopupProps, PopupState> {

    constructor(props: YesNoPopupProps | CancelSubmitPopupProps) {
        super(props);

        this.state = {
            loading: false
        };
    }

    public render(): JSX.Element {
        const sections = [{
            title: this.props.title,
            content: (
                <Fragment>
                    {this.props.content}
                    <div className='buttons' >
                        {this.props.popupType === PopupType.YesNo ?
                            <Fragment>
                                <button className="secondary" onClick={this.props.onSecondary} >No</button>
                                <button onClick={this.handlePrimary.bind(this)}>Yes</button>
                            </Fragment> : <Fragment>
                                <button className="secondary" onClick={this.props.onSecondary} >Cancel</button>
                                <button type="submit" form={this.props.form} onClick={this.handlePrimary.bind(this)}>Submit</button>
                            </Fragment>
                        }
                    </div>
                </Fragment>
            )
        }];

        return (
            <div className={`popup-component ${this.props.display ? 'show' : ''}`} >
                <div className="popup" >
                    <div className={`loader ${this.state.loading ? 'show' : ''}`} >
                        <Loading />
                    </div>
                    <PageContent sections={sections} small />
                </div>
            </div>
        )
    }

    private handlePrimary() {
        this.setState({
            loading: true
        });

        if (this.props.onPrimary) {
            this.props.onPrimary()
        }
    }
}