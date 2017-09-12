import {Meteor} from 'meteor/meteor';
import {Players} from './../imports/api/players';

Meteor.startup(() => {

});

/*

//Object spread operator
let user = {
    name: "Lp",
    location: "Montreal",
    age: 21
};

let person = {
    ...user,
    age: 27
};

console.log(person);

//Object property shorthand
let bike = "Scott";
let stuff = {
    bike,
    laptop: "Mac"
};

console.log(stuff);

let house = {
    bedrooms: 2,
    bathrooms: 1.5
};

let yearBuilt = 1995;

let details = {
    ...house,
    yearBuilt,
    bedrooms: 3,
    flooring: 'Carpet'
}
console.log(details);

*/