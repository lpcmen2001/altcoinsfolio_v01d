import {Meteor} from 'meteor/meteor';
import {Assets} from './assets';
import {AllTickers} from './alltickers';
import pullOrders from './pullOrders';
import fillBtcValueAtE from './fillBtcValueAtE.js';


export default function (bittrex) {
    /*
    const fillBTCValueAtEpoch = function (transactionArray, idx){
        console.log(".");
        epochVal = transactionArray[idx].epoch;
        let query = "https://blockchain.info/charts/market-price?timespan=1days&format=json&start=" + epochVal;
        HTTP.get(query, function(err, result){
            if (err){
                console.log(err);
                transactionArray[idx].btcTickerAtDeposit = 0;
            }
            if (result){
                if (result.data.values[0]){
                    transactionArray[idx].btcTickerAtWithdrawal = result.data.values[0].y
                }else{
                    var currentTime = new Date();
                    var currentEpoch = Math.floor(Date.parse(currentTime)/1000);
                    if (currentEpoch-epochVal < 100000){
                        HTTP.get('https://blockchain.info/ticker', function(error, results){
                            if (error) {
                                console.log(error);
                            }
                            if (results) {
                                transactionArray[idx].btcTickerAtWithdrawal = results.data['USD'].last;
                            }
                        });
                    }
                }
            }
            let newIdx = idx + 1;
            if (newIdx == transactionArray.length){
                console.log("Done updating historical BTC Values.");
                finishUpdateWithdrawalHistory(transactionArray);
            }else{
                fillBTCValueAtEpoch(transactionArray, newIdx);
            }   
        });
    }
    */
    const updateFromWithdrawalHistory = function(){
        let withdrawalsLog = new Array();
        console.log("Starting pull of withdrawals history...");
        (async () => {
            let withdrawals = await bittrex.accountGetWithdrawalhistory();
            withdrawals = withdrawals.result;
            for (withdrawal of withdrawals){
                let currentEpoch = Math.floor(Date.parse(withdrawal.Opened)/1000);
                let newValidWithdrawal = true;
                let tryToFindInDb = Assets.findOne({symbol: withdrawal.Currency});
                if (tryToFindInDb){
                    if(tryToFindInDb.withdrawals){
                        for (withdrawalDb of tryToFindInDb.withdrawals){
                            if (withdrawalDb._id == withdrawal.TxId ){
                                //console.log("Withdrawal already added in Db, skipping id #" + withdrawal.TxId);
                                newValidWithdrawal = false;
                            }
                        }
                    }else{
                        console.log("Withdrawal of " + tryToFindInDb.symbol + " don't exists.");
                    }
                }else{
                    if (!withdrawal.Authorized || withdrawal.PendingPayment || withdrawal.Canceled || withdrawal.InvalidAddress){
                        console.log("Rejected Withdrawal because it was invalid");
                        newValidWithdrawal = false;
                    }
                }
                if (newValidWithdrawal){
                    withdrawalsLog.push({
                        _id: withdrawal.TxId,
                        symbol: withdrawal.Currency,
                        qty: withdrawal.Amount,
                        date: withdrawal.Opened,
                        epoch: currentEpoch,
                        feeInSymbol: withdrawal.TxCost,
                        feeInBtc: 0,
                        feeInUsd: 0,
                        btcTickerAtWithdrawal: 0,
                        btcValueAtWithdrawal: 0,
                        usdValueAtWithdrawal: 0
                    });
                }
            }
            console.log("Logged Withdrawal history.");
            if (withdrawalsLog.length > 0){
                console.log("Updating Withdrawal Historical BTC Prices... ");
                fillBtcValueAtE(withdrawalsLog,0,finishUpdateWithdrawalHistory,'withd');
                //fillBTCValueAtEpoch(withdrawalsLog, 0);
            }else{
                nextStage();
            }
        })()
    }
    const finishUpdateWithdrawalHistory = function(transactionArray){
        console.log("Starting calculation of values...");
        
        for (withdrawal of transactionArray){
            if (withdrawal.symbol == 'BTC'){
                withdrawal.btcValueAtWithdrawal = withdrawal.qty;
                withdrawal.usdValueAtWithdrawal = parseFloat(withdrawal.qty * withdrawal.btcTickerAtWithdrawal).toFixed(2);
                withdrawal.feeInBtc = withdrawal.feeInSymbol;
                withdrawal.feeInUsd = parseFloat(withdrawal.feeInBtc * withdrawal.btcTickerAtWithdrawal).toFixed(4)
            }else{
                let thisSymbolPriceBtc = AllTickers.findOne({symbol: withdrawal.symbol}).btcprice;
                withdrawal.btcValueAtWithdrawal = withdrawal.qty * thisSymbolPriceBtc;
                withdrawal.usdValueAtWithdrawal = parseFloat(withdrawal.btcValueAtWithdrawal * withdrawal.btcTickerAtWithdrawal).toFixed(2);
                withdrawal.feeInBtc = (withdrawal.feeInSymbol * thisSymbolPriceBtc).toFixed(6);
                withdrawal.feeInUsd = parseFloat(withdrawal.feeInBtc * withdrawal.btcTickerAtWithdrawal).toFixed(2)
            } 
        }
        console.log("Finished calculation of values.");
        updateAssetsWithWithdrawalHistory(transactionArray); 
        
    }
    const updateAssetsWithWithdrawalHistory = function (transactionArray){
        console.log("Starting update of Withdrawal assets in db...");
        for (withdrawal of transactionArray){
            myAsset = Assets.findOne({symbol: withdrawal.symbol});
            if (myAsset){
                let newWithdrawalsArray  = new Array();
                let newWithdrawalStatus = true;
                if (myAsset.withdrawals){
                    newWithdrawalsArray = myAsset.withdrawals;
                }
                for (withd of newWithdrawalsArray){
                    if (withd._id == withdrawal._id){
                        newWithdrawalStatus = false;
                    }
                }
                if (newWithdrawalStatus){
                    newWithdrawalsArray.push(withdrawal);
                    Assets.update(myAsset._id, {$set:{withdrawals: newWithdrawalsArray}});
                }
            }else{
                //creating a new asset for a deposit.
                let assetPrice = AllTickers.findOne({symbol: withdrawal.symbol}).price;
                let myNewAsset = {
                    symbol: withdrawal.symbol,
                    btcprice: assetPrice,
                    balance: 0,
                    withdrawals: [withdrawal]
                };
                Meteor.call('assets.insert',myNewAsset);
            }
        }
        console.log("Done with update of Withdrawal in assets of db.")
        nextStage();

    }
    const nextStage = function(){
        console.log("Withdrawals processing finished");
        pullOrders(bittrex);
    }
    updateFromWithdrawalHistory();
};


