import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const Assets = new Mongo.Collection('assets');

if (Meteor.isServer){
    Meteor.publish('assets', function () {
        return Assets.find({});
    });

}

Meteor.methods({
    'assets.insert':function(asset){
        Assets.insert({
            symbol: asset.symbol,
            btcprice: asset.btcprice,
            balance: asset.balance,
        });
    }
});