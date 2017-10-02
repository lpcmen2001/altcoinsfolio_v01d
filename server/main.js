import {Meteor} from 'meteor/meteor';
import {Players} from './../imports/api/players';

//import updateBtcHistory from './../imports/api/updateBtcHistory';         

import apiBalance from './../imports/api/bittrex/apiBalance';


//import pullBalances from './../imports/api/pullBalances';


//import Baby from 'babyparse';
//var fs = require('fs');  


var ccxt = require ('ccxt');
//https://github.com/kroitor/ccxt/wiki/Manual

Meteor.startup(() => {
    let bittrex = new ccxt.bittrex();



    Meteor.methods({
        'balance.update':function(){
            apiBalance(bittrex);
        }
    });

    apiBalance(bittrex);

    //updateBtcHistory();

    /* 
    if (Meteor.isServer) {
        var base = process.env.PWD;
        var file = base + '/chunkaa.csv';
        var content = fs.readFileSync(file, { encoding: 'utf8' });

        Baby.parse(content, {
            step: function(row){
                console.log("Row: ", row.data);
            }
        });
    }
    */

   //pullBalances(bittrex);

   /*
   var csvString = '1;2;3;4'
   var results = Papa.parse(csvString);
   console.log(results);
    */




    /*
    //CHECK ORDERS OF A SPECIFIC SYMBOL
    
    (async () => {
        let orders = await bittrex.accountGetOrderhistory();
        orders = orders.result;
        for (order of orders){
            if (order.Exchange == 'BTC-BLOCK'){ 
                console.log(order);
            }
        }
        
    })();
    */    


    //....

    //influx
    //balance
    //outflux

    //deposits
    //balance
    //widthdrawal

    //BALANCE =         INFLUX          -          OUTFLUX
   //book value = deposits + buy orders - (widthdrawal + sell orders)

    /*
    (async () => {
        console.log (await bittrex.fetchBalance ())
    }) ()
    */
    //console.log("bittrex",bittrex);

    /*
    //GET BTC VALUE AT EPOCH DATE
    HTTP.get("https://blockchain.info/charts/market-price?timespan=1days&format=json&start=1502210987", function(err, result){
        if (err){
          console.log('err',err);
        }
        if (result){
          console.log('result', result.data.values[0].y);
        }
    });
    */

    /*
    //GET WITHDRAWAL HISTORY & convert times WITH:
    (async () => {
        let widthdrawal = await bittrex.accountGetWithdrawalhistory ()
        console.log (bittrex.id, widthdrawal.result)
        console.log ("date", widthdrawal.result[0].Opened);
        console.log("In epoch", Math.floor(Date.parse(widthdrawal.result[0].Opened)/1000));
    }) ()
    */
    

    // GET ORDER HISTORY WITH : 
    /*
    (async () => {
        let orders = await bittrex.accountGetOrderhistory ()
        console.log (bittrex.id, orders)
    }) ()
    */

    /*
    // GET DEPOSIT HISTORY WITH : 
    (async () => {
        let deposits = await bittrex.accountGetDeposithistory();
        console.log(bittrex.id, deposits);
    }) ()
    */

    /*
    // GET MARKETS WITH : 
    (async () => {
        let markets = await bittrex.load_markets ()
        console.log (bittrex.id, markets)
    }) ()
    */

    
    //GET BALANCE WITH :
    



    // FETCH TICKER OF ONE
    /*
    (async () => {
        let ticker = await bittrex.fetchTicker ('XRP/BTC');
        console.log(ticker.info);
    }) ()
    */

    //BALANCE OF ONE WITH
    /*
    (async () => {
        let balance = await bittrex.accountGetBalance ({currency:'xrp'});
        console.log(balance.result);
    }) ()
    */

    /*HTTP.get("https://bittrex.com/api/v1.1/public/getmarkets", function(err, result){
    if (err){
      console.log('err',err);
    }
    if (result){
      console.log('result', JSON.parse(result.content));
    }
  });
    */




});