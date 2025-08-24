const mongoose = require("mongoose");
const carpenterDB = require("./carpenterData.js");
const elctricalDB = require("./elctricalData.js");
const plumberDB = require("./plumberData.js");
const carpenter = require("../models/carpenter.js");
const elctrical = require("../models/elctrical.js");
const plumber = require("../models/plumber.js");

 
const MONGO_URL = "mongodb://127.0.0.1:27017/utility";

main().then(()=>{
    console.log("conected to Database");
})
.catch((err)=>{
    console.log(err);
});
async function main(){
    await mongoose.connect(MONGO_URL);
};



const carDB = async ()=>{
   await carpenter.deleteMany({});
   await carpenter.insertMany(carpenterDB.cardata);
   console.log(" carpenter data initialize ho gaya");
}
carDB();

const elcDB = async ()=>{
    await elctrical.deleteMany({});
    await elctrical.insertMany(elctricalDB.elcdata);
    console.log(" elctrical data initialize ho gaya");
 }
 elcDB();

 const plumDB = async ()=>{
    await plumber.deleteMany({});
    await plumber.insertMany(plumberDB.plumdata);
    console.log("plumber data initialize ho gaya");
 }
 plumDB();