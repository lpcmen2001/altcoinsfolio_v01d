import {Meteor} from 'meteor/meteor';
import {Assets} from './assets';
import {AllTickers} from './alltickers';
import updateActiveOrders from './updateActiveOrders';

import calculateBookValue from './calculateBookValue';

export default function (bittrex) {
    console.log("Starting PullBookValues");
    let allAssets = Assets.find().fetch();
    for (asset of allAssets){
        let assetBookValue = calculateBookValue(bittrex,asset.symbol);
        //console.log(assetBookValue); 
        Assets.update(asset._id, {$set:{bookValue: assetBookValue}});
    }
    console.log("Done updating pullBookValues");
    updateActiveOrders();

};
