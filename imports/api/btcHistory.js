import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const BtcHistory = new Mongo.Collection('btcHistory');

if (Meteor.isServer){
    Meteor.publish('btcHistory', function () {
        return BtcHistory.find({});
    });

}

Meteor.methods({
    'btcHistory.insert':function(btcHistory){
        BtcHistory.insert({
            year : btcHistory.year,
            months : btcHistory.months
        });
    }
});