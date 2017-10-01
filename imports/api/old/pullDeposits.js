import {Meteor} from 'meteor/meteor';
import {Assets} from './assets';
import {AllTickers} from './alltickers';
import pullWithdrawals from './pullWithdrawals';
import {BtcHistory} from './btcHistory';
import fillBtcValueAtE from './fillBtcValueAtE.js';

export default function (bittrex) {
    /*
    const fillBTCValueAtEpoch = function (transactionArray, idx){
        console.log(".");
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
        console.log("Looking for " + epochDay + ' of ' + epochMonth + ' of ' + epochYear + ' aka ' + epochVal);
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
            console.log("dbValueFound local ");
            transactionArray[idx].btcTickerAtDeposit = epochDeltaObj.usdPrice;
            let newIdx = idx + 1;
            if (newIdx == transactionArray.length){
                console.log("Done updating historical BTC Values.");
                finishUpdateDepHistory(transactionArray);
            }else{
                fillBTCValueAtEpoch(transactionArray, newIdx);
            }   
        }
        else if (!dbValueFound){
            console.log("Going online for values");
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
                    finishUpdateDepHistory(transactionArray);
                }else{
                    fillBTCValueAtEpoch(transactionArray, newIdx);
                }   
            });
        }
    }
    */
    const updateFromDepositHistory = function(){
        let depositsLog = new Array();
        console.log("Starting pull of deposits history...");
        (async () => {
            let deposits = await bittrex.accountGetDeposithistory();
            deposits = deposits.result;
            for (deposit of deposits){
                let currentEpoch = Math.floor(Date.parse(deposit.LastUpdated)/1000);
                let newValidDeposit = true; 
                let tryToFindInDb = Assets.findOne({symbol: deposit.Currency});
                if (tryToFindInDb){
                    if(tryToFindInDb.deposits){
                        for (depositDb of tryToFindInDb.deposits){
                            if (depositDb._id == deposit.Id ){
                                //console.log("Deposit arealdy added in Db, skipping id #" + deposit.Id); 
                                newValidDeposit = false;
                            }
                        }
                    }else{
                        console.log("Deposits of " + tryToFindInDb.symbol + " don't exists.");
                    }
                }
                if (newValidDeposit){
                    depositsLog.push({
                        _id: deposit.Id,
                        symbol: deposit.Currency,
                        qty: deposit.Amount,
                        date: deposit.LastUpdated,
                        epoch: currentEpoch,
                        btcTickerAtDeposit: 0,
                        btcValueAtDeposit: 0,
                        usdValueAtDeposit: 0
                    });
                }
            }
            console.log("Logged deposits history.");
            if (depositsLog.length > 0){
                console.log("Updating Deposits Historical BTC Prices...");
                fillBtcValueAtE(depositsLog,0,finishUpdateDepHistory,'dep');
                //fillBTCValueAtEpoch(depositsLog, 0);
            }else{
                nextStage();
            }
        })()
    }
    const finishUpdateDepHistory = function(transactionArray){
        console.log("Starting calculation of values...");

        for (deposit of transactionArray){
            if (deposit.symbol == 'BTC'){
                deposit.btcValueAtDeposit = deposit.qty;
                deposit.usdValueAtDeposit = parseFloat(deposit.qty * deposit.btcTickerAtDeposit).toFixed(2);
            }else{
                let thisSymbolPriceBtc = AllTickers.findOne({symbol: deposit.symbol}).btcprice;
                deposit.btcValueAtDeposit = deposit.qty * thisSymbolPriceBtc;
                deposit.usdValueAtDeposit = parseFloat(deposit.btcValueAtDeposit * deposit.btcTickerAtDeposit).toFixed(2);
            } 
        }
        console.log("Finished calculation of values.");
        updateAssetsWithDepHistory(transactionArray);
    }
    const updateAssetsWithDepHistory = function (transactionArray){
        console.log("Starting update of Deposits assets in db...");
        for (deposit of transactionArray){
            myAsset = Assets.findOne({symbol: deposit.symbol});
            if (myAsset){
                let newDepositsArray  = new Array();
                let newDepositStatus = true;
                if (myAsset.deposits){
                    newDepositsArray = myAsset.deposits;
                }
                for (depo of newDepositsArray){
                    if (depo._id == deposit._id){
                        newDepositStatus = false;
                    }
                }
                if (newDepositStatus){
                    newDepositsArray.push(deposit);
                    Assets.update(myAsset._id, {$set:{deposits: newDepositsArray}});
                }
            }else{
                //creating a new asset for a deposit
                let assetPrice = AllTickers.findOne({symbol: deposit.symbol}).price;
                let myNewAsset = {
                    symbol: deposit.symbol,
                    btcprice: assetPrice,
                    balance: 0,
                    deposits: [deposit]
                };
                Meteor.call('assets.insert',myNewAsset);
            }
        }
        console.log("Done with update of assets in db.")
        nextStage();

    }
    const nextStage = function(){
        console.log("Deposit processing finished");
        pullWithdrawals(bittrex);
    }
    updateFromDepositHistory();
};


