import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const AllTickers = new Mongo.Collection('alltickers');

if (Meteor.isServer){
    Meteor.publish('alltickers', function () {
        return AllTickers.find({});
    });

}

Meteor.methods({
    'alltickers.insert':function(alltickeritem){
        AllTickers.insert({
            symbol: alltickeritem.symbol,
            btcprice: alltickeritem.btcprice
        });
    }
});