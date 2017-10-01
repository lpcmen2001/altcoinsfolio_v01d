import React from 'react';

import TitleBar from './TitleBar';
import AddPlayer from './AddPlayer';
import PlayerList from './PlayerList';
//import DataTable from './DataTable';
import SortExample from './DataTableSort';

//<DataTable/>  

export default class App extends React.Component {
  render() {
    return (
      <div>
        <TitleBar title={this.props.title} subtitle="by CoutureLp"/>
        <div className="wrapper">
          <PlayerList players={this.props.players}/>
          <AddPlayer/>
          
          <SortExample/>
        </div>
      </div>
    );
  }
};

App.propTypes = {
  title: React.PropTypes.string.isRequired,
  players: React.PropTypes.array.isRequired
};
