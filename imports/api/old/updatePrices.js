import {Meteor} from 'meteor/meteor';
import {Assets} from './assets';
import {AllTickers} from './alltickers';
import pullDeposits from './pullDeposits';

export default function (bittrex) {
    const updatePrices = function(){
        const myAssets = Assets.find().fetch();
        const myTickers = new Array();
        for (asset of myAssets){
            const tickerSymbol = asset.symbol + '/BTC';
            const tickerObj = {
                _id : asset._id,
                ticksymbol : tickerSymbol,
                symbol : asset.symbol
            }
            myTickers.push(tickerObj);
        }
        (async () => {
            let tickers = await bittrex.fetchTickers();
            for (tick of myTickers){
                let symbol = tick.symbol;
                let price = 0;
                switch (symbol){
                    case 'BTC':
                        price = 1;
                        break;
                    case 'USDT':
                        price = 1/tickers['BTC/USDT'].info.Last;
                        break;
                    case 'BCC':
                        price = tickers['BCH/BTC'].info.Last;
                        break;
                    default:
                        price = tickers[tick.ticksymbol].info.Last; 
                        break;
                }
                Assets.update(tick._id, {$set:{btcprice: price}});
            }
            Object.keys(tickers).forEach(function(key,index) {
                if (key.substr(key.length-3,key.length) == "BTC"){
                    let symbol = key.substr(0,key.length-4);
                    let price = tickers[key].info.Last;
                    let existingTicker = AllTickers.findOne({symbol:symbol});
                    if (existingTicker){
                        AllTickers.update(existingTicker._id, {$set:{btcprice: price}});
                        if (existingTicker.symbol == 'BCH'){
                            let findbcc = AllTickers.findOne({symbol:'BCC'});
                            AllTickers.update(findbcc._id, {$set:{btcprice: price}});
                        }
                    }else{
                        let myTicketValue = {
                            symbol: symbol,
                            btcprice: price
                        }
                        Meteor.call('alltickers.insert',myTicketValue);
                        if (symbol == "BCH"){
                            let secondTicketValue = {
                                symbol: 'BCC',
                                btcprice: price
                            }
                            Meteor.call('alltickers.insert',secondTicketValue);
                        }
                        console.log(myTicketValue.symbol + " added to AllTickers.");
                    }
                }
            });
            console.log("Done updating prices");
            pullDeposits(bittrex);
        }) ()
    }
    updatePrices();
};


