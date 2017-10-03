import React from 'react';
import ReactDOM from 'react-dom';
import {Table, Column, Cell} from 'fixed-data-table-2';
import { Assets } from '../api/assets';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

// Table data as a list of array.  
//https://facebook.github.io/fixed-data-table/getting-started.html  

const AssetsObjectDataListStore = require('./AssetsObjectDataListStore');
const { TextCell } = require('./cells');

var SortTypes = {
  ASC: 'ASC',
  DESC: 'DESC',
};

function reverseSortDirection(sortDir) {
  return sortDir === SortTypes.DESC ? SortTypes.ASC : SortTypes.DESC;
}

class SortHeaderCell extends React.Component {
  constructor(props) {
    super(props);
    this._onSortChange = this._onSortChange.bind(this);
  }

  render() {
    var {onSortChange, sortDir, children, ...props} = this.props;
    return (
      <Cell {...props}>
        <a onClick={this._onSortChange}>
          {children} {sortDir ? (sortDir === SortTypes.DESC ? '↓' : '↑') : ''}
        </a>
      </Cell>
    );
  }

  _onSortChange(e) {
    e.preventDefault();

    if (this.props.onSortChange) {
      this.props.onSortChange(
        this.props.columnKey,
        this.props.sortDir ?
          reverseSortDirection(this.props.sortDir) :
          SortTypes.DESC
      );
    }
  }
}

class DataListWrapper {
  constructor(indexMap, data) {
    this._indexMap = indexMap;
    this._data = data;
  }

  getSize() {
    return this._indexMap.length;
  }

  getObjectAt(index) {
    return this._data.getObjectAt(
      this._indexMap[index],
    );
  }
}

class SortExample extends React.Component {
  constructor(props) {
    super(props);

    this.handle = Meteor.subscribe('assets',()=>{this.setState({assets:Assets.find().fetch()});});

    this._dataList = new AssetsObjectDataListStore();

    this._defaultSortIndexes = [];
    this.rowsCountAmnt = 3;
    var size = this._dataList.getSize();

    this.currentMode = 'sort';

    for (var index = 0; index < size; index++) {
      this._defaultSortIndexes.push(index);
    }

    this.state = {
      btcUsdValue:0,
      size: size,
      counter: 0,
      rowHeight: 50,
      sortedDataList: this._dataList,
      filteredDataList: this._dataList,
      colSortDirs: {}
    };

    this._onSortChange = this._onSortChange.bind(this);
    this._onFilterChange = this._onFilterChange.bind(this);
  }



  _onFilterChange(e) {
    if (!e.target.value) {
      this.setState({
        filteredDataList: this._dataList,
      });
    }
    this.currentMode = 'filter';
    var filterBy = e.target.value.toLowerCase();
    var size = this._dataList.getSize();
    var filteredIndexes = [];
    for (var index = 0; index < size; index++) {
      var {symbol} = this._dataList.getObjectAt(index);
      if (symbol.toLowerCase().indexOf(filterBy) !== -1) {
        filteredIndexes.push(index);
      }
    }

    this.setState({
      filteredDataList: new DataListWrapper(filteredIndexes, this._dataList),
    });
  }

  componentDidMount(){
    this.assetTracker = Tracker.autorun(()=>{
        const isReady = this.handle.ready();  
        if (isReady){
          this.forceUpdate(()=>{
            this._dataList = new AssetsObjectDataListStore();
            this.setState({sortedDataList: this._dataList});
            let myFunct = function(){
              this._stdOnSortChange();
            }
            this.updateBtcUsdValue();

            myFunct = myFunct.bind(this);
            setTimeout(myFunct, 500);
          }); 
        }
    });
}
updateBtcUsdValue(){
  let dbUsdValue = Assets.findOne({symbol:'USDT'});
  if (dbUsdValue){
      dbUsdValue = dbUsdValue.btcprice;
      let usdBtcValue = parseFloat(1/dbUsdValue).toFixed(2);
      this.setState({btcUsdValue:usdBtcValue});
  }
} 

_stdOnSortChange() {
  let newSize = this.state.sortedDataList.size;
    if (this.state.sortedDataList.size < 5){
      return 0;
    }
      let columnKey = 'btcprice';
      let sortDir = SortTypes.ASC;

      if (this._defaultSortIndexes.length != this.state.sortedDataList.size){
        this._defaultSortIndexes = [];
        var size = this._dataList.getSize();
        for (var index = 0; index < size; index++) {
          this._defaultSortIndexes.push(index);
        }
      }
  
      var sortIndexes = this._defaultSortIndexes.slice();
      sortIndexes.sort((indexA, indexB) => {
        var valueA = this._dataList.getObjectAt(indexA)[columnKey];
        var valueB = this._dataList.getObjectAt(indexB)[columnKey];
        var sortVal = 0;
        if (valueA > valueB) {
          sortVal = 1;
        }
        if (valueA < valueB) {
          sortVal = -1;
        }
        if (sortVal !== 0 && sortDir === SortTypes.ASC) {
          sortVal = sortVal * -1;
        }
  
        return sortVal;
      });
  
      this.setState({
        sortedDataList: new DataListWrapper(sortIndexes, this._dataList),
        colSortDirs: {
          [columnKey]: sortDir,
        },
      });
      if (newSize){
        this.rowsCountAmnt = newSize;
      }
  
      this.forceUpdate();
    }


  _onSortChange(columnKey, sortDir) {
    this.currentMode = 'sort';
    if (this._defaultSortIndexes.length != this.state.sortedDataList.size){
      this._defaultSortIndexes = [];
      var size = this._dataList.getSize();
      for (var index = 0; index < size; index++) {
        this._defaultSortIndexes.push(index);
      }
    }

    var sortIndexes = this._defaultSortIndexes.slice();
    sortIndexes.sort((indexA, indexB) => {
      var valueA = this._dataList.getObjectAt(indexA)[columnKey];
      var valueB = this._dataList.getObjectAt(indexB)[columnKey];
      switch (columnKey){
        case 'bookpnlUsd':
          valueA = Number(this._dataList.getObjectAt(indexA).book.pnlUsd);
          valueB = Number(this._dataList.getObjectAt(indexB).book.pnlUsd);
          break;
        case 'bookbalCurUsdValue':
          valueA = Number(this._dataList.getObjectAt(indexA).book.balCurUsdValue);
          valueB = Number(this._dataList.getObjectAt(indexB).book.balCurUsdValue);
          break;
        case 'bookbalCostUsd':
          valueA = Number(this._dataList.getObjectAt(indexA).book.balCostUsd);
          valueB = Number(this._dataList.getObjectAt(indexB).book.balCostUsd);
          break;
        case 'bookbalUnrPnlPercent':
          valueA = Number(this._dataList.getObjectAt(indexA).book.balUnrPnlPercent);
          valueB = Number(this._dataList.getObjectAt(indexB).book.balUnrPnlPercent);
          break;
        case 'bookbalUnrPnlUsd':
          valueA = Number(this._dataList.getObjectAt(indexA).book.balUnrPnlUsd);
          valueB = Number(this._dataList.getObjectAt(indexB).book.balUnrPnlUsd);
          break;
        default:
          break;
      }



      var sortVal = 0;
      if (valueA > valueB) {
        sortVal = 1;
      }
      if (valueA < valueB) {
        sortVal = -1;
      }
      if (sortVal !== 0 && sortDir === SortTypes.ASC) {
        sortVal = sortVal * -1;
      }

      return sortVal;
    });

    this.setState({
      sortedDataList: new DataListWrapper(sortIndexes, this._dataList),
      colSortDirs: {
        [columnKey]: sortDir,
      },
    });
    if (this.state.sortedDataList.size){
      this.rowsCountAmnt = this.state.sortedDataList.size;
    }

    this.forceUpdate();
  }
  refreshVars(){
    Meteor.call('balance.update');
    console.log("Refreshing");
  }
  render() {
    let dataPointer = null;
    var {sortedDataList, colSortDirs} = this.state;
    var {filteredDataList} = this.state;


    if (this.currentMode == 'sort'){
      if (!sortedDataList._cache){
        let newData = new Array();
        for (index of sortedDataList._indexMap){
          newData.push(sortedDataList._data._cache[index]);
        }
        dataPointer = newData;
      }else if(sortedDataList._cache){
        dataPointer = sortedDataList._cache;
      }
    }
    else if (this.currentMode == 'filter'){
      if (!filteredDataList._cache){
        let newData = new Array();
        this.rowsCountAmnt = filteredDataList._indexMap.length;
        for (index of filteredDataList._indexMap){
          newData.push(filteredDataList._data._cache[index]);
        }
        dataPointer = newData;
      }else if(filteredDataList._cache){
        dataPointer = filteredDataList._cache;
      }
    }

    return (
      <div>
        <input
          onChange={this._onFilterChange}
          placeholder="Filter by Symbol"
        />
        <br />
      <button onClick={this.refreshVars.bind(this)}>Refresh</button>
      <Table
        rowHeight={this.state.rowHeight}
        rowsCount={this.rowsCountAmnt}
        headerHeight={50}
        width={800}
        height={this.state.rowHeight+(this.rowsCountAmnt*this.state.rowHeight)}
        {...this.props}>
        <Column
          columnKey="symbol"
          header={
            <SortHeaderCell
              onSortChange={this._onSortChange}
              sortDir={colSortDirs.symbol}>
              Symbol
            </SortHeaderCell>
          }
          cell={({columnKey, rowIndex, ...props}) => (
                  <Cell {...props}>
                      {dataPointer[rowIndex][columnKey]}
                  </Cell>
                )}
          width={100}
        />

        <Column
          columnKey="bookpnlUsd"
          header={
            <SortHeaderCell
              onSortChange={this._onSortChange}
              sortDir={colSortDirs.bookpnlUsd}>
              Overall P&L
            </SortHeaderCell>
          }
          cell={({columnKey, rowIndex, ...props}) => (
                  <Cell {...props}>
                      {dataPointer[rowIndex].book.pnlUsd + '$'}
                  </Cell>
                )}
          width={100}
        />
        <Column
          columnKey="balance"
          header={
            <SortHeaderCell
              onSortChange={this._onSortChange}
              sortDir={colSortDirs.balance}>
              Balance
            </SortHeaderCell>
          }
          cell={({columnKey, rowIndex, ...props}) => (
                  <Cell {...props}>
                      {parseFloat(dataPointer[rowIndex][columnKey]).toFixed(3)}
                  </Cell>
          )}
          width={100}
        />
        <Column
          columnKey="btcprice"
          header={
            <SortHeaderCell
              onSortChange={this._onSortChange}
              sortDir={colSortDirs.btcprice}>
              BtcPrice
            </SortHeaderCell>
          }
          cell={({columnKey, rowIndex, ...props}) => (
                  <Cell {...props}>
                      {parseFloat(dataPointer[rowIndex][columnKey]).toFixed(8)}
                  </Cell>
                )}
          width={100}
        />
        <Column
          columnKey="bookbalCurUsdValue"
          header={
            <SortHeaderCell
              onSortChange={this._onSortChange}
              sortDir={colSortDirs.bookbalCurUsdValue}>
              Market Value ($)
            </SortHeaderCell>
          }
          cell={({columnKey, rowIndex, ...props}) => (
                  <Cell {...props}>
                      {dataPointer[rowIndex].book.balCurUsdValue}
                  </Cell>
                )}
          width={100}
        />
        <Column
          columnKey="bookbalCostUsd"
          header={
            <SortHeaderCell
              onSortChange={this._onSortChange}
              sortDir={colSortDirs.bookbalCostUsd}>
              Book Value ($)
            </SortHeaderCell>
          }
          cell={({columnKey, rowIndex, ...props}) => (
                  <Cell {...props}>
                      {dataPointer[rowIndex].book.balCostUsd}
                  </Cell>
                )}
          width={100}
        />
        <Column
          columnKey="bookbalUnrPnlPercent"
          header={
            <SortHeaderCell
              onSortChange={this._onSortChange}
              sortDir={colSortDirs.bookbalUnrPnlPercent}>
              P&L (%)
            </SortHeaderCell>
          }
          cell={({columnKey, rowIndex, ...props}) => (
                  <Cell {...props}>
                      {dataPointer[rowIndex].book.balUnrPnlPercent + '%'}
                  </Cell>
                )}
          width={100}
        />
        <Column
          columnKey="bookbalUnrPnlUsd"
          header={
            <SortHeaderCell
              onSortChange={this._onSortChange}
              sortDir={colSortDirs.bookbalUnrPnlUsd}>
              P&L ($)
            </SortHeaderCell>
          }
          cell={({columnKey, rowIndex, ...props}) => (
                  <Cell {...props}>
                      {dataPointer[rowIndex].book.balUnrPnlUsd + '$'}
                  </Cell>
                )}
          width={100}
        />



      </Table>

      </div>
    );
  }
}


/*
                            book.pnlBtc = 0;
                            book.pnlUsd = 0;
                            book.balCostBtc = 0;
                            book.balCostUsd = 0;
                            book.balCurUsdValue = 0;
                            book.balCurBtcValue = 0;
                            book.balUnrPnlBtc = 0;
                            book.balUnrPnlUsd = 0;
                            book.balUnrPnlPercent = 0;
                            book.balAvgCostUnitBtc = 0;
                            book.balAvgCostUnitUsd = 0;

*/

module.exports = SortExample;