const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ServiceSchema0 = new Schema({
    service:{
        type:String,
        required:true
    },
    name:{ 
        type:String,
        required:true
    },
    description:{type:String},
    phone:{type:String},
    price:{type:Number},
    location:{ type:String},
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }] 
});
const Page0 = mongoose.model("carpenter", ServiceSchema0);
module.exports = Page0;
  