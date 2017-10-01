import {Meteor} from 'meteor/meteor';
import {BtcHistory} from './btcHistory';

import Baby from 'babyparse';
var fs = require('fs');

export default function () {

    this.latestEpoch = 0;
    this.filename = '';

    const addMinutes =  function (date, minutes) {
        return new Date(date.getTime() + minutes*60000);
    }

    const pullLatestEpoch = function(){
        let btcHist = BtcHistory.find({}).fetch();
        let highestYear = 0;
        let highestYearId = 0;
        let highestMonth = 0;
        let highestMonthIndex = 0;
        let highestDay = 0;
        let highestDayIndex = 0;
        let highestEpoch = 0;
        if (btcHist){
            for (year of btcHist){
                if (year.year > highestYear){
                    highestYear = year.year;
                    highestYearId = year._id;
                }
            }
            let months = BtcHistory.findOne({_id: highestYearId});
            if (months){
                months = months.months;
                for (month of months){
                    if (month.month > highestMonth){
                        highestMonth = month.month;
                        highestMonthIndex = months.indexOf(month);
                    }
                }
                let days = months[highestMonthIndex].days;
                for (day of days){
                    if (day.day > highestDay){
                        highestDay = day.day;
                        highestDayIndex = days.indexOf(day);
                    }
                }
                let epochs = days[highestDayIndex].epochs;
                for (epoch of epochs){
                    if (epoch.epoch > highestEpoch){
                        highestEpoch = epoch.epoch;
                    }
                }
                return highestEpoch;
            }else{
                return 0;
            }
        }else{
            return 0;
        }
    }


    const addBtcHistoryEntry = function(epoch, price){
        //console.log('--' + epoch + '--');
        if (epoch <= (this.latestEpoch+900)){
            //console.log('skipped ' + epoch + ' @ $' + price + ' because LE is ' + (latestEpoch+900));
            return 0;
        }
        let diffLatestCurrent = this.latestEpoch-epoch;
        if (diffLatestCurrent > -900){
            //console.log('Start Diff from latest and current is ' + (this.latestEpoch-epoch) + ' then is rejected');
            return 0
        }

        let startOfTimeEpoch = epoch;
        let startOfTime = new Date(epoch*1000);
        let startOfTimeValue = price;
        let startOfTimeDay = startOfTime.getDate();
        let startOfTimeMonth = startOfTime.getMonth()+1;
        let startOfTimeYear = startOfTime.getFullYear();

        let epochObj = {
            epoch: startOfTimeEpoch,
            usdPrice: startOfTimeValue
        }
        let dayObj = {
            day: startOfTimeDay,
            epochs: [epochObj]
        }
        let monthObj = {
            month: startOfTimeMonth,
            days: [dayObj]
        }
        let yearObj = {
            year: startOfTimeYear,
            months: [monthObj]
        }

        let yearPointer = BtcHistory.findOne({year:startOfTimeYear});
        if (!yearPointer){
            console.log('did not find year as ' + startOfTimeYear);
        }

        let monthPointer = null;
        let dayPointer = null;
        let epochPointer = null;

        if (!yearPointer){ //if year is not found, add yearObj
            Meteor.call('btcHistory.insert',yearObj);
        }else if (yearPointer){ //if year is found, look for month
            if (yearPointer.months){
                let foundMonth = false;
                for (month of yearPointer.months){
                    if (month.month == startOfTimeMonth){ //if month is found,
                        foundMonth = true;
                        let indexOfMonth = (yearPointer.months).indexOf(month);
                        (yearPointer.months).splice(indexOfMonth,1);
                        monthPointer = month;
                    }
                }
                if (!foundMonth){ // if month is not found, push monthObj onto months of yearPointer and update yearPointer attribute months
                    yearPointer.months.push(monthObj);
                    BtcHistory.update(yearPointer._id, {$set:{months: yearPointer.months}});
                }else if (foundMonth){ // if month is found, look for day
                    if (monthPointer.days){
                        let foundDay = false;
                        //console.log("looking for day " + startOfTimeDay + " within ", monthPointer.days);
                        for (day of monthPointer.days){
                            if (day.day == startOfTimeDay){
                                foundDay = true;
                                let indexOfDay = (monthPointer.days).indexOf(day);
                                (monthPointer.days).splice(indexOfDay,1);
                                dayPointer = day;
                            }
                        }
                        if (!foundDay){ // if day is not found, push dayObj onto days of monthPointer then update yearPointer attribute months
                            monthPointer.days.push(dayObj);
                            yearPointer.months.push(monthPointer);
                            BtcHistory.update(yearPointer._id,{$set:{months: yearPointer.months}});
                            console.log("Added day " + startOfTimeDay + " of month " + startOfTimeMonth + " of year " + startOfTimeYear + " @ : " + startOfTimeValue + " $USD. from file " + this.filename);
                        }else if (foundDay){ // if day is found, look for epoch
                            if (dayPointer.epochs){
                                let foundEpoch = false;
                                for (epoch of dayPointer.epochs){
                                    if (epoch.epoch == startOfTimeEpoch){
                                        foundEpoch = true;
                                        //let indexOfEpoch = (dayPointer.epochs).indexOf(epoch);
                                        //(dayPointer.epochs).splice(indexOfEpoch,1);
                                        epochPointer = epoch;
                                    }
                                }
                                if (!foundEpoch){ // if epoch is not found, push epochObj onto dayPointer, then replace dayPointer in monthPointer, then replace monthPointer in yearPointer, then update yearpOinter
                                    let skipAdding = false;
                                    let targetE = startOfTimeEpoch;
                                    let target = new Date(targetE*1000);
                                    let lowerTarget = addMinutes(target,-15);
                                    let lowerTargetE = lowerTarget.getTime()/1000.0;
                                    let higherTarget = addMinutes(target, 15);
                                    let higherTargetE = higherTarget.getTime()/1000.0;
                                    //console.log(lowerTargetE + ' aka ' + lowerTarget + ' & ' + targetE + ' aka ' + target + ' & ' + higherTargetE + ' aka ' + higherTarget);
                                    for (epoch of dayPointer.epochs){
                                        if (epoch.epoch > lowerTargetE && epoch.epoch < higherTargetE){
                                            //console.log("Too similar to current entry that is from base " + epoch.epoch + ' and logged this.latestE is ' + this.latestEpoch + ' as  lowE, latest, highE : ' + lowerTargetE + ' < ' + epoch.epoch + ' < ' + higherTargetE);
                                            //console.log('Diff from latest and current is ' + (this.latestEpoch-targetE) + ' then is rejected');
                                            skipAdding = true;
                                        }
                                    }
                                    if (!skipAdding){
                                        //console.log('Diff from latest and current is ' + (this.latestEpoch-targetE) + ' then is accepted');
                                        dayPointer.epochs.push(epochObj);
                                        this.latestEpoch = startOfTimeEpoch;
                                        //console.log("Added " + startOfTimeEpoch + ' on day ' + startOfTimeDay);
                                    }
                                    monthPointer.days.push(dayPointer);
                                    yearPointer.months.push(monthPointer);
                                    BtcHistory.update(yearPointer._id,{$set:{months: yearPointer.months}});
                                } else if (foundEpoch){//if epoch is found 
                                    //console.log("Epoch " + startOfTimeEpoch + " already added with price " + epochPointer.usdPrice);
                                } 
                            }
                        }
                    }
                }
            }
        }
    }

    if (Meteor.isServer) {
        
        const getFileName = function (idx){
            let filename = 'chunk';
            switch (idx){
                case 0:
                    filename = filename + 'aa';
                    break;
                case 1:
                    filename = filename + 'ab';
                    break;
                case 2:
                    filename = filename + 'ac';
                    break;
                case 3:
                    filename = filename + 'ad';
                    break;
                case 4:
                    filename = filename + 'ae';
                    break;
                case 5:
                    filename = filename + 'af';
                    break;
                case 6:
                    filename = filename + 'ag';
                    break;
                case 7:
                    filename = filename + 'ah';
                    break;
                case 8:
                    filename = filename + 'ai';
                    break;
                case 9:
                    filename = filename + 'aj';
                    break;
                case 10:
                    filename = filename + 'ak';
                    break;
                case 11:
                    filename = filename + 'al';
                    break;
                case 12:
                    filename = filename + 'am';
                    break;
                case 13:
                    filename = filename + 'an';
                    break;
                case 14:
                    filename = filename + 'ao';
                    break;
                case 15:
                    filename = filename + 'ap';
                    break;
                case 16:
                    filename = filename + 'aq';
                    break;
                case 17:
                    filename = filename + 'ar';
                    break;
                case 18:
                    filename = filename + 'as';
                    break;
                case 19:
                    filename = filename + 'at';
                    break;
                case 20:
                    filename = filename + 'au';
                    break;
                case 21:
                    filename = filename + 'av';
                    break;
                case 22:
                    filename = filename + 'aw';
                    break;
                case 23:
                    filename = filename + 'ax';
                    break;
                case 24:
                    filename = filename + 'ay';
                    break;
                case 25:
                    filename = filename + 'az';
                    break;
                case 26:
                    filename = filename + 'ba';
                    break;
                case 27:
                    filename = filename + 'bb';
                    break;
                case 28:
                    filename = filename + 'bc';
                    break;
                default:
                    break;
            }
            filename = filename + '.csv';
            this.filename = filename;
            return filename;
        }

        let index = 0;
        let base = process.env.PWD;
        let file = base + '/' + getFileName(index);
        let content = fs.readFileSync(file, { encoding: 'utf8' }); 


        const doEntryCycle = function(base,file,content){
            console.log("Starting with file @index " + index + " which is file : " + getFileName(index));
            this.latestEpoch = pullLatestEpoch();
            console.log("Highest Epoch is currently " + this.latestEpoch);
            Baby.parse(content, {
                step: function(row){
                    let epoch = row.data[0][0];
                    let price = row.data[0][1];
                    price = parseFloat(price).toFixed(2);
                    addBtcHistoryEntry(epoch, price);
                }
            });
            console.log("Done with file @index " + index + " which is file : " + getFileName(index));
            index = index + 1;
            if (index == 29){
                console.log('Fully done at index 26');
                return 0;
            }
            base = process.env.PWD;
            file = base + '/' + getFileName(index);
            content = fs.readFileSync(file, { encoding: 'utf8' });
            doEntryCycle(base,file,content); //callbacks
        }
        doEntryCycle(base,file,content); //first run
    }
};


