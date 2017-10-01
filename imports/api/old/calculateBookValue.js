import {Meteor} from 'meteor/meteor';
import {Assets} from './assets';
import {AllTickers} from './alltickers';

export default function (bittrex, symbol) {
        const getSymbolReturns = function() {
            //console.log("Pulling balances of " + symbol);

            let feeInBtc = 0;
            let feeInUsd = 0;
            let bookValBtc = 0;
            let bookValUsd = 0;
            let qty = 0;

            let currentSymbol = Assets.findOne({symbol:symbol});
            let hasDeposits = false;
            let hasWithdrawals = false;
            let hasOrders = false;

            let deposits = null;
            let withdrawals = null;
            let orders = null;

            if (currentSymbol) {
                if (currentSymbol.deposits){
                    deposits = currentSymbol.deposits;
                    hasDeposits = true;
                    //console.log(symbol + " has " + deposits.length + " Deposits");
                    for (deposit of deposits){
                        bookValBtc = bookValBtc + Number(deposit.btcValueAtDeposit);
                        bookValUsd = bookValUsd + Number(deposit.usdValueAtDeposit);
                        qty = qty + Number(deposit.qty);
                    }
                }
                if (currentSymbol.withdrawals){
                    withdrawals = currentSymbol.withdrawals;
                    hasWithdrawals = true;
                    //console.log(symbol + " has " +  withdrawals.length + " Withdrawals");
                    for (withdrawal of withdrawals){
                        feeInBtc = feeInBtc + Number(withdrawal.feeInBtc);
                        feeInUsd = feeInUsd + Number(withdrawal.feeInUsd);
                        bookValBtc = bookValBtc - Number(withdrawal.btcValueAtWithdrawal);
                        bookValUsd = bookValUsd - Number(withdrawal.usdValueAtWithdrawal);
                        qty = qty - Number(withdrawal.qty);
                        qty = qty - Number(withdrawal.feeInSymbol);
                    }
                }
                if (currentSymbol.orders){
                    orders = currentSymbol.orders;
                    hasOrders = true;
                    //console.log(symbol + " has " + orders.length + " Orders");
                    for (order of orders){
                        if (order.type == "buy"){
                            feeInBtc = feeInBtc + Number(order.feeInBtc);
                            feeInUsd = feeInUsd + Number(order.feeInUsd);
                            bookValBtc = bookValBtc + Number(order.btcValueAtOrder);
                            bookValUsd = bookValUsd + Number(order.usdValueAtOrder);
                            qty = qty + Number(order.qty);
                            qty = qty - Number(order.feeInSymbol);
                        }else if (order.type == "sell"){
                            feeInBtc = feeInBtc + Number(order.feeInBtc);
                            feeInUsd = feeInUsd + Number(order.feeInUsd);
                            bookValBtc = bookValBtc - Number(order.btcValueAtOrder);
                            bookValUsd = bookValUsd - Number(order.usdValueAtOrder);
                            qty = qty - Number(order.qty);
                            qty = qty - Number(order.feeInSymbol);
                        }   
                    }
                }
            }
            if (qty < 0.0001){
                qty = 0;
            }
            bookValUsd = bookValUsd.toFixed(3);
            let symbolReturns = {
                feeInBtc: feeInBtc,
                feeInUsd: feeInUsd,
                bookValBtc: bookValBtc,
                bookValUsd: bookValUsd,
                qty: qty
            };
            return symbolReturns;
        }
        return getSymbolReturns();
};

    //BALANCE =         INFLUX          -          OUTFLUX
   //book value = deposits + buy orders - (widthdrawal + sell orders)
