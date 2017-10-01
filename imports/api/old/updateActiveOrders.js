import {Meteor} from 'meteor/meteor';
import {Assets} from './assets';
import {AllTickers} from './alltickers';

export default function () {
    const updateActiveOrders = function(){
        const myAssets = Assets.find().fetch();
        if (myAssets){
            for (asset of myAssets){
                if(asset.balance > 0.00001){
                    let inflow = 0
                    let outflow = 0
                    let assetOrders = asset.orders;
                    if (assetOrders){
                        for (order of assetOrders){
                            if (order.type == 'buy'){
                                inflow = inflow + Number(order.qty);
                            }else if (order.type == 'sell'){
                                outflow = outflow + Number(order.qty);
                            }
                        }
                    }
                    let deposits = asset.deposits;
                    if (deposits){
                        for (deposit of deposits){
                            inflow = inflow + Number(deposit.qty);
                        }
                    }
                    let withdrawals = asset.withdrawals;
                    if (withdrawals){
                        for (withdrawal of withdrawals){
                            outflow = outflow + Number(withdrawal.qty);
                        }
                    }
                    if (inflow > outflow){
                        let balance = Number(inflow) - Number(outflow);
                        //console.log('Positive balance of ' + balance + ' detected for ' + asset.symbol + '.' );

                        let balanceLeft = balance;
                        let btcCost = 0;
                        let usdCost = 0;
                        let btcCostPerUnit = 0;
                        let usdCostPerUnit = 0;

                        let allOrders = asset.orders;
                        if (allOrders){
                            let totalItems = allOrders.length;
                            totalItems = totalItems-1;
                            //for (let i = totalItems ; i > -1 ; i--){
                            for (order of allOrders){
                                if (order.type == 'buy'){
                                    if (balanceLeft > Number(order.qty)){
                                        balanceLeft = balanceLeft - Number(order.qty);
                                        btcCost = btcCost + Number(order.btcValueAtOrder);
                                        usdCost = usdCost + Number(order.usdValueAtOrder);
                                    }
                                    else if (balanceLeft == 0 || balanceLeft < 0){

                                    }else{
                                        let diff = Number(order.qty) - balanceLeft;
                                        balanceLeft = 0;
                                        let ratio = (diff/(Number(order.qty)));
                                        btcCost = btcCost + (Number(order.btcValueAtOrder) * ratio);
                                        usdCost = usdCost + (Number(order.usdValueAtOrder) * ratio);
                                    }
                                }
                            }
                        }
                        btcCostPerUnit = btcCost / balance;
                        usdCostPerUnit = usdCost / balance;
                        let btcCostForBal = btcCostPerUnit * asset.balance;
                        let usdCostForBal = usdCostPerUnit * asset.balance;
                        let activeOrdersStats = {
                            btcCost: parseFloat(btcCost).toFixed(8),
                            usdCost: parseFloat(usdCost).toFixed(2),
                            btcCostPerUnit: parseFloat(btcCostPerUnit).toFixed(8),
                            usdCostPerUnit: parseFloat(usdCostPerUnit).toFixed(2),
                            btcCostForBal: parseFloat(btcCostForBal).toFixed(8),
                            usdCostForBal: parseFloat(usdCostForBal).toFixed(2),
                            balanceUpdated: asset.balance
                        }
                        //console.log(activeOrdersStats);
                        //console.log("About to update assets");
                        Assets.update(asset._id, {$set:{activeOrdersStats: activeOrdersStats}});
                    }

                }else{
                    //console.log('Balance of ' + asset.symbol + ' is lower than 0.00001.');
                }
            }
        }
        console.log("Done with updateActiveOrders");
    }
    updateActiveOrders();
};


