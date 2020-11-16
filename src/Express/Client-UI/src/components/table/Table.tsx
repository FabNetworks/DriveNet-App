import { MultipleChoiceSelect } from '../multipleChoiceSelect/MultipleChoiceSelect';
import { Select } from '../select/Select';
import React, { Fragment } from 'react';
import './table.scss';

export enum FilterType
{
  Select = 1,
  MultipleChoiceSelect
}

enum Sorting
{
  Ascending = 'asc',
  Descending = 'desc'
}

type SortingFunction = (a: string | number, b: string | number) => number;

const numPerPageOptions = [10, 20, 40, 60];

export enum DateString
{
  Present = 2147483647000,
  Pending = -1,
}

export interface ColumnProps<T extends string>
{
  display?: string;
  accessor: T;
  filter?: FilterType;
  keepTextFormat?: boolean;
  contentWidth?: boolean;
  contentFormat?: 'default' | 'date';
  primaryKey?: boolean;
  customSort?: SortingFunction;
}

export type DataProps<T extends string> = {
  [K in T]: string | number;
}

interface TableProps<T extends string>
{
  columns: ColumnProps<T>[];
  data: DataProps<T>[];
  onRowClick?(row: string | number): void;
  flashContent?: boolean;
  disableActions?: boolean;
}

interface TableState<T extends string>
{
  filterChoices: {
    [K in T]?: (string | number)[];
  };

  sorting?: {
    accessor: T;
    direction: Sorting;
  };

  numPerPage: number;
  currentPage: number;
  filters: {
    [K in T]?: (string | number)[];
  };
}

export class Table<T extends string> extends React.Component<TableProps<T>, TableState<T>> {
  public constructor (props: TableProps<T>)
  {
    super(props);

    const filterChoices: { [K in T]?: (string | number)[] } = {};
    const filters: { [K in T]?: (string | number)[] } = {};

    props.columns.forEach((column) =>
    {
      if (column.filter) {
        filterChoices[column.accessor] = props.data.map((row) => row[column.accessor]).filter((value, index, self) => self.indexOf(value) === index);
        filters[column.accessor] = [];
      }
    });

    this.state = {
      numPerPage: 10,
      currentPage: 0,
      filters,
      filterChoices
    };
  }

  public render(): JSX.Element
  {
    return (
      <div className="table-component" >
        { this.renderOptions()}
        <table>
          <thead>
            <tr>
              {this.props.columns.map((column) => this.renderHeading(column))}
            </tr>
          </thead>
          <tbody className={`${this.props.flashContent ? 'flash' : ''}`}>
            {this.renderTableContents()}
          </tbody>
        </table>
        { numPerPageOptions[0] < this.props.data.length && this.renderPageFinder()}
      </div>
    );
  }

  public componentDidUpdate(previousProps: TableProps<T>): void
  {
    // need to refresh filter choices and this is a non-foolproof easy way to do that - may not work in all cases so keep an eye out
    if (this.props.data.length !== previousProps.data.length || JSON.stringify(this.props.data[0]) !== JSON.stringify(previousProps.data[0])) {
      const filterChoices: { [K in T]?: (string | number)[] } = {};
      const filters: { [K in T]?: (string | number)[] } = {};

      this.props.columns.forEach((column) =>
      {
        if (column.filter) {
          const choices: (string | number)[] = this.props.data.map((row) => row[column.accessor]).filter((value, index, self) => self.indexOf(value) === index);
          filterChoices[column.accessor] = choices;

          // reset their filter if its no longer selectable
          const existingChoices = this.state.filters[column.accessor];

          if (Array.isArray(existingChoices) && existingChoices.every((existingChoice) => choices.includes(existingChoice))) {
            filters[column.accessor] = existingChoices;
          } else {
            filters[column.accessor] = [];
          }
        }
      });

      this.setState({
        filterChoices,
        filters
      });
    }
  }

  private renderOptions(): JSX.Element
  {
    return (
      <div className="options" >
        {Object.keys(this.state.filterChoices).length > 0 && this.props.data.length > 0 &&
          <span className="filters" >
            <img src={process.env.PUBLIC_URL + '/icons/filter.svg'} alt="filtering" />
            {this.props.columns.filter((column) => column.filter).map((column) =>
            {
              return (
                <span key={`filter-${column.accessor}`}>
                  {column.display || column.accessor}:&nbsp;
                  {this.renderFilter(column)}
                </span>
              );
            })}
          </span>
        }
        {numPerPageOptions[0] < this.props.data.length &&
          <span className="perPage" >
            Showing&nbsp;
            <Select onSelect={(choice): void => this.setState({ numPerPage: choice as number, currentPage: 0 })} choices={numPerPageOptions} />
            &nbsp;per page
          </span>
        }
      </div>
    );
  }

  private renderFilter(column: ColumnProps<T>): JSX.Element
  {
    /* eslint-disable indent */
    switch (column.filter) {
      case FilterType.Select: return this.renderSelectFilter(column);
      case FilterType.MultipleChoiceSelect: return this.renderMultipleChoiceSelectFilter(column);
      default: return <Fragment />;
    } /* eslint-enable indent */
  }

  private renderSelectFilter(column: ColumnProps<T>): JSX.Element
  {
    return (
      <Select onSelect={(choice): void => this.storeSelectFilter(choice, column.accessor)} choices={['any' as string | number].concat(this.state.filterChoices[column.accessor] as (string | number)[])} />
    );
  }

  private renderMultipleChoiceSelectFilter(column: ColumnProps<T>): JSX.Element
  {
    const filterChoices = this.state.filterChoices[column.accessor];

    return (
      <MultipleChoiceSelect
        onSelect={(choice): void => this.storeMultipleChoiceSelectFilter(choice, column.accessor)}
        onDeselect={(choice): void => this.unstoreMultipleChoiceSelectFilter(choice, column.accessor)}
        choices={Array.isArray(filterChoices) ? filterChoices : []}
      />
    );
  }

  private renderTableContents(): JSX.Element | JSX.Element[]
  {
    if (this.props.data.length === 0) {
      return (
        <tr className="normalCursor centre" >
          <td colSpan={this.props.columns.length} >No content to display</td>
        </tr>
      );
    }

    return this.getTableData().map((row, index) =>
    {
      const idColumn = this.props.columns.find((column) => column.primaryKey) || this.props.columns[0];

      const onClick = (): void =>
      {
        (this.props.onRowClick as (id: string | number) => void)(row[idColumn.accessor]);
      };

      return (
        <tr className={`${!this.props.onRowClick ? 'normalCursor' : ''}`} key={'table-row-' + index} onClick={this.props.onRowClick ? onClick : undefined} >
          {this.props.columns.map((column) => <td className={`${column.keepTextFormat ? 'lowercase' : ''} ${column.contentWidth ? 'contentWidth' : ''}`} key={`${column.accessor}-${String(index)}`} >
            {this.renderData(row[column.accessor], column.contentFormat)}
          </td>)}
        </tr>
      );
    });
  }

  private renderData(data: (string | number), format: 'default' | 'date' = 'default'): string | JSX.Element
  {
    if (!data) {
      return <span>-</span>;
    }

    if (format === 'date') {
      if (data === data + '') {
        throw new Error('Data in date contentFormat column must be numeric timestamp. For strings like Present use the enum DateString');
      }

      return <span>{formatDate(data as number)}</span>;
    }

    return <span>{data}</span>;
  }

  private renderHeading(column: ColumnProps<T>): JSX.Element
  {
    const sortingClass = this.state.sorting?.accessor === column.accessor ? `sort ${this.state.sorting?.direction}` : '';
    const onClick = this.props.disableActions ? undefined : (): void => this.sort(column.accessor);

    return (
      <th
        key={column.accessor}
        onClick={onClick}
        className={`${this.props.disableActions ? 'disableSort' : ''} ${sortingClass} ${column.contentWidth ? 'contentWidth' : ''}`}
      >
        {column.display || column.accessor}
      </th>
    );
  }

  private renderPageFinder(): JSX.Element
  {
    const numPages = Math.ceil(this.filterData(this.props.data).length / this.state.numPerPage);

    let startNumbering = 0;

    if (numPages > 9 && this.state.currentPage !== 0) {
      startNumbering = this.state.currentPage - 1;
    }

    const numToDisplay = Math.min(9, numPages);
    const numRun = Math.min(startNumbering + numToDisplay, numPages - 1);

    if (numRun - startNumbering < 9 && numRun - 9 > 0) {
      startNumbering = numRun - 9;
    }

    const pageFinder = [];

    for (let i = startNumbering; i < numRun; i++) {
      pageFinder.push((
        <button key={`pageOption-${String(i)}`} onClick={(): void => this.changePage(i)} className={`pageOption ${i === this.state.currentPage ? 'selected' : ''}`} >{i + 1}</button>
      ));
    }

    if (numRun !== numPages - 1) {
      pageFinder.push((
        <li><span>...</span></li>
      ));
    }

    pageFinder.push((
      <button key={'pageOption-lastPage'} onClick={(): void => this.changePage(numPages - 1)} className={`pageOption ${numPages === this.state.currentPage + 1 ? 'selected' : ''}`} >{numPages}</button>
    ));

    return (
      <div className="pageFinder" >
        <input onClick={(): void => this.changePage(0)} disabled={this.state.currentPage === 0} type="image" alt="previous page" src={process.env.PUBLIC_URL + '/icons/chevron-left.svg'} />
        { pageFinder}
        <input onClick={(): void => this.changePage(numPages - 1)} disabled={this.state.currentPage === numPages - 1} type="image" alt="next page" src={process.env.PUBLIC_URL + '/icons/chevron-right.svg'} />
      </div>
    );
  }

  private storeSelectFilter(value: string | number, accessor: T): void
  {
    const newFilter: { [K in T]?: (string | number)[] } = {};
    newFilter[accessor] = value === 'any' ? [] : [value];

    this.setState({
      filters: Object.assign(this.state.filters, newFilter),
      currentPage: 0
    });
  }

  private storeMultipleChoiceSelectFilter(value: string | number, accessor: T): void
  {
    const existing = this.state.filters[accessor];

    const newFilter: { [K in T]?: (string | number)[] } = {};
    newFilter[accessor] = Array.isArray(existing) ? existing : [];

    (newFilter[accessor] as (string | number)[]).push(value);

    this.setState({
      filters: Object.assign(this.state.filters, newFilter),
      currentPage: 0
    });
  }

  private unstoreMultipleChoiceSelectFilter(value: string | number, accessor: T): void
  {
    const existing = this.state.filters[accessor];

    const newFilter: { [K in T]?: (string | number)[] } = {};
    newFilter[accessor] = Array.isArray(existing) ? existing : [];

    newFilter[accessor] = (newFilter[accessor] as (string | number)[]).filter((filterVal) => filterVal !== value);

    this.setState({
      filters: Object.assign(this.state.filters, newFilter),
      currentPage: 0
    });
  }

  private sort(accessor: T): void
  {
    let direction = Sorting.Descending;

    if (this.state.sorting && this.state.sorting.accessor === accessor && this.state.sorting.direction === Sorting.Descending) {
      direction = Sorting.Ascending;
    }

    this.setState({
      sorting: {
        accessor,
        direction
      },
      currentPage: 0
    });
  }

  private changePage(newPage: number): void
  {
    this.setState({
      currentPage: newPage
    });
  }

  private getTableData(): DataProps<T>[]
  {
    const data = this.props.data;
    const dataStart = this.state.currentPage * this.state.numPerPage;
    const dataEnd = dataStart + this.state.numPerPage;

    return this.sortData(this.filterData(data)).slice(dataStart, dataEnd);
  }

  private filterData(data: DataProps<T>[]): DataProps<T>[]
  {
    for (const accessor in this.state.filters) {
      const filterValues = this.state.filters[accessor as T];

      if (!Array.isArray(filterValues) || filterValues.length === 0) {
        continue;
      }

      data = data.filter((row) =>
      {
        return filterValues.includes(row[accessor as T]);
      });
    }

    return data;
  }

  private sortData(data: DataProps<T>[]): DataProps<T>[]
  {
    if (!this.state.sorting) {
      return data;
    }

    const accessor = this.state.sorting.accessor;
    const direction = this.state.sorting.direction;

    const column = this.props.columns.find((column) => column.accessor === accessor);

    if (column && column.customSort) {
      return data.sort((a, b) =>
      {
        const returnVal = (column.customSort as SortingFunction)(a[accessor], b[accessor]);

        return direction === Sorting.Ascending ? returnVal * -1 : returnVal;
      });
    }

    return data.sort((a, b) =>
    {
      const aData = a[accessor];
      const bData = b[accessor];

      let returnVal = 0;

      if (aData > bData) {
        returnVal = -1;
      } else if (aData < bData) {
        returnVal = 1;
      }

      return direction === Sorting.Ascending ? returnVal * -1 : returnVal;
    });
  }
}

function getOrdinal(dayOfMonth: number): string
{
  if (dayOfMonth > 3 && dayOfMonth < 21) {
    return 'th';
  }

  switch (dayOfMonth % 10) { /* eslint-disable indent */
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  } /* eslint-enable indent */
}

function padTime(time: number): string
{
  if (time < 10) {
    return '0' + time;
  }

  return time.toString();
}

const Months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatDate(timestamp: number): string | (string | JSX.Element)[]
{
  if (timestamp === DateString.Present) {
    return 'present';
  } else if (timestamp === DateString.Pending) {
    return '██ ██████ ████ ██:██';
  }

  const date = new Date(timestamp);

  return [
    date.getDate().toString(),
    <sup key="dateSup" >{getOrdinal(date.getDate())}</sup>,
    ' ',
    Months[date.getMonth()],
    ' ',
    date.getFullYear().toString(),
    ' ',
    padTime(date.getHours()),
    ':',
    padTime(date.getMinutes())
  ];
}

