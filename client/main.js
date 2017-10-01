import React from 'react';
import ReactDOM from 'react-dom';
import {Meteor} from 'meteor/meteor';
import {Tracker} from 'meteor/tracker';

import {Players, calculatePlayerPositions} from './../imports/api/players';
import App from './../imports/ui/App';


//key = '274f331aa36545468768fa2068f6aed2';
//skey = '2aae47dcd592483eaf5f52e5e7962a4e';


Meteor.startup(() => {
  Tracker.autorun(() => {
    let players = Players.find({}, {sort: {score: -1}}).fetch();
    let positionedPlayers = calculatePlayerPositions(players);
    let title = 'Score Keep';
    ReactDOM.render(<App title={title} players={positionedPlayers}/>, document.getElementById('app'));
    //console.log(CryptoJS.HmacSHA512(""))
    //apiCall('https://bittrex.com/api/v1.1/account/getbalances?apikey=274f331aa36545468768fa2068f6aed2',displayData)
    //apiCall('https://bittrex.com/api/v1.1/public/getmarkets', displayData);



  });

});
