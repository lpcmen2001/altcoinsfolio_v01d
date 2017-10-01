import {Meteor} from 'meteor/meteor';
import {Assets} from './assets';
import {AllTickers} from './alltickers';
//start 
export default function () {
        const getSymbolReturns = function() {
            let btcUsdValue = 0;
            let balCostBtc = 0;
            HTTP.get('https://blockchain.info/ticker', function(error, results){
                if (error) {
                    console.log(error);
                }
                if (results) {
                    btcUsdValue = results.data['USD'].last;
                    console.log("calculateBook.js : Updating Book Updating...");
                    let allAssets = Assets.find({}).fetch();
                    for (asset of allAssets){
                        //console.log("Updating " + asset.symbol + ".");
                        let cost = 0;
                        let value = 0;
                        let epochArray = new Array();
                        if (asset.orders){
                            for (order of asset.orders){
                                //console.log("order id: " + order._id);
                                switch (order.type){
                                    case 'buy':
                                        epochArray.push(order.epoch);
                                        cost = cost + Number(order.priceBtc);
                                        break;
                                    case 'sell':
                                        value = value + Number(order.priceBtc);
                                        break;
                                    default:
                                        console.log('Wrong order.type, Fatal Error');
                                        break;
                                }
                            }
                            epochArray.sort(function(a, b){return b-a});
                            let balanceSymbol = Number(asset.balance);
                            let balance = balanceSymbol;
                            let costFound = false;
                            let costBtc = 0;
                            let costPerItem = 0;
                            let curIndex = 0;
                            while (!costFound){
                                //console.log('Going to account for ' + balance);
                                for (orderItem of asset.orders){
                                    if (orderItem.epoch == epochArray[0] && orderItem.type == 'buy'){
                                        if (orderItem.qty > balance){
                                            costBtc = Number(costBtc) + ((Number(orderItem.priceBtc)*Number(balance))/Number(orderItem.qty));
                                            curIndex++;
                                            costFound = true;
                                        }else if (orderItem.qty == balance){
                                            costBtc = Number(costBtc) + Number(orderItem.priceBtc);
                                            curIndex++;
                                            costFound = true;
                                        }else if (orderItem.qty < balance){
                                            costBtc = costBtc + Number(orderItem.priceBtc);
                                            balance = balance - Number(orderItem.qty);
                                            curIndex++;
                                            costFound = false;
                                        }
                                    }
                                }
                            }
                            costPerItem = Number(costBtc/balanceSymbol);
                            balCostBtc = costBtc;

                        }
                        if (asset.balance){
                            let balanceBtcValue = Number(asset.btcprice) * Number(asset.balance);
                            if (balanceBtcValue > 0){
                                value = value + Number(balanceBtcValue);
                            }
                        }
                        let balanceSymbol = Number(asset.balance);
                        let pnlBtc = value - cost;
                        let pnlUsd = parseFloat(pnlBtc * Number(btcUsdValue)).toFixed(2);
                        let balCostUsd = 0;
                        let balCurBtcValue = 0;
                        let balCurUsdValue = 0;
                        let balAvgCostUnitBtc = 0;
                        let balAvgCostUnitUsd = 0;
                        let balUnrPnlBtc = 0;
                        let balUnrPnlUsd = 0;
                        let balUnrPnlPercent = 0;

                        if (balanceSymbol > 0){
                            balCostUsd = parseFloat(balCostBtc * Number(btcUsdValue)).toFixed(2);
                            balCurBtcValue = parseFloat(Number(balanceSymbol) * Number(asset.btcprice)).toFixed(8);
                            balCurUsdValue = parseFloat(Number(balCurBtcValue) * Number(btcUsdValue)).toFixed(2);
                            balAvgCostUnitBtc = parseFloat(Number(balCostBtc)/Number(balanceSymbol)).toFixed(8);
                            balAvgCostUnitUsd = parseFloat(Number(balAvgCostUnitBtc) * Number(btcUsdValue)).toFixed(6);
                            balUnrPnlBtc = parseFloat(Number(balCurBtcValue)-Number(balCostBtc)).toFixed(8);
                            balUnrPnlUsd = parseFloat(Number(balCurUsdValue)-Number(balCostUsd)).toFixed(2);

                            let curBtcPnl = Number(balUnrPnlBtc);
                            let gain = false;
                            let loss = false;
                            if (curBtcPnl >= 0){
                                gain = true;
                            }else{
                                loss = true;
                                curBtcPnl = -curBtcPnl;
                            }
                            let percentPnl = parseFloat(curBtcPnl/balCostBtc).toFixed(6);
                            percentPnl = Number(percentPnl) * 100;
                            if (loss){
                                percentPnl = -percentPnl; 
                            }
                            balUnrPnlPercent = parseFloat(percentPnl).toFixed(2);
                        }

                        let book = {
                            cost : cost,
                            value : value,
                            pnlBtc : pnlBtc,
                            pnlUsd : pnlUsd,
                            balCostBtc : balCostBtc,
                            balCostUsd : balCostUsd,
                            balCurUsdValue : balCurUsdValue,
                            balCurBtcValue : balCurBtcValue,
                            balUnrPnlBtc : balUnrPnlBtc,
                            balUnrPnlUsd: balUnrPnlUsd,
                            balUnrPnlPercent : balUnrPnlPercent,
                            balAvgCostUnitBtc : balAvgCostUnitBtc,
                            balAvgCostUnitUsd : balAvgCostUnitUsd
        
                        }
                        if (asset.symbol == 'BTC' || asset.symbol == 'USDT'){
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
                            Assets.update(asset._id, {$set:{book: book}});
                        }else{
                            Assets.update(asset._id, {$set:{book: book}});
                        } 
                        balCostBtc = 0;
                    }
                    nextStage();
                }
            });
        }
        const nextStage = function(){
            console.log("calculateBook.js : Updating Book Done.");
            let overallpl = 0;
            let unrealizedpl = 0;
            let allAssets = Assets.find({}).fetch();
            for (asset of allAssets){
                if (asset.book){
                    overallpl = Number(overallpl) + Number(asset.book.pnlUsd);
                    unrealizedpl = Number(unrealizedpl) + Number(asset.book.balUnrPnlUsd);
                }
            }
            console.log("Complete average of Overall P&L : " + parseFloat(overallpl).toFixed(2) + "$.");
            console.log("Complete Unrealized P&L : " + parseFloat(unrealizedpl).toFixed(2) + "$.");
        }
        getSymbolReturns();
};
