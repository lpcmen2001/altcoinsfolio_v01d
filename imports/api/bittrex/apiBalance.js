import {Meteor} from 'meteor/meteor';
import {Assets} from '../assets';
import apiTickers from './apiTickers';

export default function (bittrex) {
        const apiBalance = function (){
            console.log("apiBalance.js : Bittrex API Balance Updating...");
            let allAssets = Assets.find({}).fetch();
            if (allAssets){
                for (asset of allAssets){
                    Assets.update(asset._id, {$set:{balance: 0}});
                }
            }
            (async () => {
                let balances = await bittrex.accountGetBalances ();
                let balObj = balances.result;
                for (var i = 0 ; i < balObj.length ; i++){
                    if (balObj[i].Balance != 0){
                        myAsset = {
                            symbol: balObj[i].Currency,
                            btcprice: 0,
                            balance: balObj[i].Balance
                        };
                        let newBalance = balObj[i].Balance;
                        let thisAsset = Assets.findOne({symbol:balObj[i].Currency});
                        
                        if (thisAsset){
                            Assets.update(thisAsset._id, {$set:{balance: newBalance}});
                        }else{
                            console.log("Adding " + balObj[i].Currency);
                            Meteor.call('assets.insert',myAsset);
                        }
                    }
                }
                console.log("apiBalance.js : Bittrex API Balance Done.");
                apiTickers(bittrex);
            })();   
        }
        apiBalance();
};


