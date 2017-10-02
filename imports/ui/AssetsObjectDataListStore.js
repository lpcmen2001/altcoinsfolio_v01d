import { Assets } from '../api/assets';
import { Tracker } from 'meteor/tracker';

class AssetsObjectDataListStore {
  constructor(){
    let assets = [{_id:1,symbol:'loading',btcprice:0,balance:1,book:{cost:0,value:0,pnlBtc:0,pnlUsd:0,balCostBtc:0,balCostUsd:0}},{_id:1,symbol:'loading',btcprice:0,balance:1,book:{cost:0,value:0,pnlBtc:0,pnlUsd:0,balCostBtc:0,balCostUsd:0}},{_id:1,symbol:'loading',btcprice:0,balance:1,book:{cost:0,value:0,pnlBtc:0,pnlUsd:0,balCostBtc:0,balCostUsd:0}},{_id:1,symbol:'loading',btcprice:0,balance:1,book:{cost:0,value:0,pnlBtc:0,pnlUsd:0,balCostBtc:0,balCostUsd:0}}];
    this.handle = Meteor.subscribe('assets',()=>{assets = Assets.find().fetch();});
    this.assetTracker = Tracker.autorun(()=>{
      const isReady = this.handle.ready();
      if (isReady){
        assets = Assets.find().fetch();
        this.size = assets.length;
        this._cache = assets;
      }
    });

    this.size = assets.length;
    this._cache = assets;

  }

  createAssetsRowObjectData(/*number*/ index) /*object*/ {
    return {
      id: index,
      city: faker.address.city(),
      email: faker.internet.email(),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      street: faker.address.streetName(),
      zipCode: faker.address.zipCode(),
      date: faker.date.past(),
      bs: faker.company.bs(),
      catchPhrase: faker.company.catchPhrase(),
      companyName: faker.company.companyName(),
      words: faker.lorem.words(),
      sentence: faker.lorem.sentence(),
    };
  }

  getObjectAt(/*number*/ index) /*?object*/ {
    if (index < 0 || index > this.size){
      return undefined;
    }
    if (this._cache[index] === undefined) {
      console.log("out of index");
    }
    else if (this._cache){
      return this._cache[index];
    }else{
      return null;
    }
    
  }

  /**
  * Populates the entire cache with data.
  * Use with Caution! Behaves slowly for large sizes
  * ex. 100,000 rows
  */
  getAll() {
    if (this._cache.length < this.size) {
      for (var i = 0; i < this.size; i++) {
        this.getObjectAt(i);
      }
    }
    return this._cache.slice();
  }

  getSize() {
    if (this._cache){
      return this.size;
    }else{
      return 0;
    }
    
  }
}

module.exports = AssetsObjectDataListStore;