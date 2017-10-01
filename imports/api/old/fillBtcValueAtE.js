import {Meteor} from 'meteor/meteor';
import {Assets} from './assets';
import {AllTickers} from './alltickers';
import pullWithdrawals from './pullWithdrawals';
import pullDeposits from './pullDeposits';
import pullOrders from './pullOrders';
import {BtcHistory} from './btcHistory';

export default function (transactionArr, idxval, cb, mode) {
    const fillBTCValueAtEpoch = function (transactionArray, idx){
        console.log(idx + ' out of ' + transactionArray.length);
        let epochVal = transactionArray[idx].epoch;
        let dbValueFound = false;
        let epochTime = new Date(epochVal*1000);
        let epochDay = epochTime.getDate();
        let epochMonth = epochTime.getMonth()+1;
        let epochYear = epochTime.getFullYear();
        let yearObj = BtcHistory.findOne({year: epochYear});
        let monthObj, dayObj = null;
        let monthFound, dayFound = false;
        let epochDelta = 20000;
        let epochDeltaObj = null;
        //console.log("Looking for " + epochDay + ' of ' + epochMonth + ' of ' + epochYear + ' aka ' + epochVal);
        if (yearObj){
            for (month of yearObj.months){
                if (month.month == epochMonth){
                    monthFound = true;
                    monthObj = month;
                }
            }
            if (monthFound){
                for (day of monthObj.days){
                    if (day.day == epochDay){
                        dayFound = true;
                        dayObj = day;
                    }
                }
                if (dayFound){
                    for (epoch of dayObj.epochs){
                        let diff = null;
                        if (epochVal < epoch.epoch){
                            diff  = epoch.epoch - epochVal;
                        }else if (epochVal > epoch.epoch){
                            diff  = epochVal - epoch.epoch;
                        }
                        if (diff < epochDelta){
                            epochDelta = diff;
                            epochDeltaObj = epoch;
                            dbValueFound = true;
                        }
                    }
                }
            }
        }
        if (dbValueFound){
            //console.log(idx + " : Found Local");
            switch (mode){
                case 'dep':
                    transactionArray[idx].btcTickerAtDeposit = epochDeltaObj.usdPrice;
                    break;
                case 'withd':
                    transactionArray[idx].btcTickerAtWithdrawal = epochDeltaObj.usdPrice;
                    break;
                case 'order':
                    transactionArray[idx].btcTickerAtOrder = epochDeltaObj.usdPrice;
                    break;
                default:
                    console.log("Wrong mode for fillBtcValueAtE");
                    break;
            }
            //orders
            //transactionArray[idx].btcTickerAtOrder
            //withd
            //transactionArray[idx].btcTickerAtWithdrawal
            //deposits
            //transactionArray[idx].btcTickerAtDeposit = epochDeltaObj.usdPrice;
            let newIdx = idx + 1;
            if (newIdx == transactionArray.length){
                console.log("Done updating historical BTC Values.");
                cb(transactionArray);
            }else{
                fillBTCValueAtEpoch(transactionArray, newIdx);
            }   
        }
        else if (!dbValueFound){
            //console.log(idx + " : Found Internet");   
            let query = "https://blockchain.info/charts/market-price?timespan=1days&format=json&start=" + epochVal;
            HTTP.get(query, function(err, result){
                if (err){
                    console.log(err);
                    transactionArray[idx].btcTickerAtDeposit = 0;
                }
                if (result){
                    if (result.data.values[0]){
                        transactionArray[idx].btcTickerAtDeposit = result.data.values[0].y
                    }else{
                        var currentTime = new Date();
                        var currentEpoch = Math.floor(Date.parse(currentTime)/1000);
                        if (currentEpoch-epochVal < 100000){
                            HTTP.get('https://blockchain.info/ticker', function(error, results){
                                if (error) {
                                    console.log(error);
                                }
                                if (results) {
                                    transactionArray[idx].btcTickerAtDeposit = results.data['USD'].last;
                                }
                            });
                        }
                    }
                }
                let newIdx = idx + 1;
                if (newIdx == transactionArray.length){
                    console.log("Done updating historical BTC Values.");
                    cb(transactionArray);
                }else{
                    fillBTCValueAtEpoch(transactionArray, newIdx);
                }   
            });
        }
    }
    fillBTCValueAtEpoch(transactionArr,idxval);
};


