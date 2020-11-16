import React from 'react';
import './loading.scss';

export class Loading extends React.Component
{
  public render(): JSX.Element
  {
    return (
      <div className="loading" >
        <div className="box" >
          <div className="inner" ></div>
        </div>
        <div className="box" >
          <div className="inner" ></div>
        </div>
        <div className="box" >
          <div className="inner" ></div>
        </div>
      </div>
    );
  }
}
