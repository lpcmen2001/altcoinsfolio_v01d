import React from 'react';
import ReactDOM from 'react-dom';
import {Table, Column, Cell} from 'fixed-data-table';
import { Assets } from '../api/assets';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

// Table data as a list of array.  
//https://facebook.github.io/fixed-data-table/getting-started.html
const rows = [
    ['a1', 'b1', 'c1'],
    ['a2', 'b2', 'c2'],
    ['a3', 'b3', 'c3'],
    // .... and more
  ];  

export default class DataTable extends React.Component {
  constructor(props){
    super(props);
    this.state = {
        assets: ['loading','loading','loading','loading'],
        counter: 0,
        rowHeight: 50,
        btcUsdValue: 0
    };
    this.handle = Meteor.subscribe('assets',()=>{this.setState({assets:Assets.find().fetch()});});
  }
  componentDidMount(){
        console.log("componentDidMount DataTable")
        this.assetTracker = Tracker.autorun(()=>{
            this.setState({assets:Assets.find().fetch()});
            this.updateBtcUsdValue();
            const isReady = this.handle.ready();
            //console.log(`Assets is ${isReady ? 'ready' : 'not ready'}`);   
            this.forceUpdate(()=>{console.log("Assets Updated")});         
        });
    }
    componentWillUnmount(){
        console.log("componentWillUnmount DataTable");
        this.assetTracker.stop();
    }
    refreshVars(){
        this.setState({assets:Assets.find().fetch()});
        Meteor.call('balance.update');
    }
    getUsdValue(rowIndex){
      let usdValueOfAsset = this.state.btcUsdValue * this.getBtcValue(rowIndex);
      return (parseFloat(usdValueOfAsset).toFixed(2));
    }
    getBtcValue(rowIndex){
      let value = this.state.assets[rowIndex].balance*this.state.assets[rowIndex].btcprice;
      return parseFloat(value).toFixed(6);
    }
    getSymbolPnl(rowIndex, currency){
      let returnVal = 'Loading...';
      if (this.state.assets[rowIndex].book){
        switch (currency){
          case 'usd':
            returnVal = this.state.assets[rowIndex].book.pnlUsd;
            break; 
          case 'btc':
            returnVal = parseFloat(this.state.assets[rowIndex].book.pnlBtc).toFixed(6);
            break;
        }
      }
      return returnVal;
    }
    getBalanceCost(rowIndex, currency){
      let returnVal = 'Loading...';
      if (this.state.assets[rowIndex].book){
        switch (currency){
          case 'usd':
            returnVal = this.state.assets[rowIndex].book.balCostUsd;
            break; 
          case 'btc':
            returnVal = parseFloat(this.state.assets[rowIndex].book.balCostBtc).toFixed(6);
            break;
        }
      }
      return returnVal;
    }
    getUnrPnl(rowIndex, currency){
      let returnVal = 'Loading...';
      if (this.state.assets[rowIndex].book){
        let curValue = 0;
        let balCost = 0;
        switch (currency){
          case 'usd':
            curValue = this.getUsdValue(rowIndex);
            balCost = this.getBalanceCost(rowIndex,'usd');
            returnVal = curValue - balCost;
            returnVal = parseFloat(returnVal).toFixed(2);
            if (this.state.assets[rowIndex].symbol == 'BTC' || this.state.assets[rowIndex].symbol == 'USDT'){
              returnVal = 0;
            }
            break; 
          case 'btc':
            curValue = this.getBtcValue(rowIndex);
            balCost = this.getBalanceCost(rowIndex,'btc');
            returnVal = curValue - balCost;
            returnVal = parseFloat(returnVal).toFixed(6);
            if (this.state.assets[rowIndex].symbol == 'BTC' || this.state.assets[rowIndex].symbol == 'USDT'){
              returnVal = 0;
            }
            break;
        }
      }
      return returnVal;
    }
    getUnrPnlPercent(rowIndex){
      let returnVal = 'Loading...';
      if (this.state.assets[rowIndex].book){
        let btcPnl = this.getUnrPnl(rowIndex,'usd');
        let loss = false;
        let gain = false;
        if (btcPnl < 0){
          loss = true;
          btcPnl = -btcPnl;
        }else{
          gain = true;
        }
        let btcInvested = parseFloat(this.state.assets[rowIndex].book.balCostUsd).toFixed(8);
        let percentPnl =  parseFloat(btcPnl/btcInvested).toFixed(6);
        percentPnl = percentPnl * 100;
        if (loss){
          percentPnl = - percentPnl;
        }
        percentPnl = parseFloat(percentPnl).toFixed(2);
        returnVal = percentPnl;
      }
      if (this.state.assets[rowIndex].symbol == 'BTC' || this.state.assets[rowIndex].symbol == 'USDT' || this.state.assets[rowIndex].balance == 0){
        returnVal = 0;
      }
      return returnVal;
    }
    updateBtcUsdValue(){
        let dbUsdValue = Assets.findOne({symbol:'USDT'});
        if (dbUsdValue){
            dbUsdValue = dbUsdValue.btcprice;
            let usdBtcValue = parseFloat(1/dbUsdValue).toFixed(2);
            this.setState({btcUsdValue:usdBtcValue});
        }
    } 
  render() {
    return (
      <div className="data-table">
            <Table
              rowHeight={this.state.rowHeight}
              rowsCount={this.state.assets.length}
              width={800}
              height={this.state.rowHeight+(this.state.assets.length*this.state.rowHeight)}
              headerHeight={50}>
              <Column
                header={<Cell>Asset</Cell>}
                cell={({rowIndex, ...props}) => (
                  <Cell {...props}>
                      {this.state.assets[rowIndex].symbol}
                  </Cell>
                )}
                width={75}
              />
              <Column
                header={<Cell>Symbol P/L (USD)</Cell>}
                cell={({rowIndex, ...props}) => (
                  <Cell {...props}>
                      {this.getSymbolPnl(rowIndex,'usd') + ' $'}
                  </Cell>
                )}
                width={75}
              />
              <Column
                header={<Cell>Symbol P/L (BTC)</Cell>}
                cell={({rowIndex, ...props}) => (
                  <Cell {...props}>
                      {this.getSymbolPnl(rowIndex,'btc')}
                  </Cell>
                )}
                width={75}
              />
              <Column
                header={<Cell>Quantity</Cell>}
                cell={({rowIndex, ...props}) => (
                  <Cell {...props}>
                      {parseFloat(this.state.assets[rowIndex].balance).toFixed(4)}
                  </Cell>
                )}
                width={75}
              />
              <Column
                header={<Cell>Price (BTC)</Cell>}
                cell={({rowIndex, ...props}) => (
                  <Cell {...props}>
                    {this.state.assets[rowIndex].btcprice}
                  </Cell>
                )}
                width={75}
              />
              <Column
                header={<Cell>Value (USD)</Cell>}
                cell={({rowIndex, ...props}) => (
                  <Cell {...props}>
                  {'$ '+this.getUsdValue(rowIndex)}
                  </Cell>
                )}
                width={75}
              />
              <Column
                header={<Cell>Bal Cost USD ($)</Cell>}
                cell={({rowIndex, ...props}) => (
                  <Cell {...props}>
                  {this.getBalanceCost(rowIndex,'usd') + '$'}
                  </Cell>
                )}
                width={75}
              />
              <Column
                header={<Cell>Unr. Active P/L ($)</Cell>}
                cell={({rowIndex, ...props}) => (
                  <Cell {...props}>
                  {this.getUnrPnl(rowIndex,'usd') + ' $'}
                  </Cell>
                )}
                width={75}
              />
              <Column
                header={<Cell>Unr. Active P/L (%)</Cell>}
                cell={({rowIndex, ...props}) => (
                  <Cell {...props}>
                  {this.getUnrPnlPercent(rowIndex) + ' %'}
                  </Cell>
                )}
                width={75}
              />
            </Table>
            <button onClick={this.refreshVars.bind(this)}>Refresh</button>
      </div>
    );
  }
}



//https://github.com/facebook/fixed-data-table

  
  // Render your table
