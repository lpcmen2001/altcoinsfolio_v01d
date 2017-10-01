import {Meteor} from 'meteor/meteor';
import {Assets} from './assets';
import updatePrices from './updatePrices';

export default function (bittrex) {
        const pullBalances = function (){
            console.log("Pulling balances");
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
                console.log("Done pulling balances");
                updatePrices(bittrex);
            })();   
        }
        pullBalances();
};


