
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ServiceSchemaB = new Schema({
    service:{
        type:String,
        required:true
    },
    name:{ 
        type:String,
        required:true
    },
    problem:{type:String,
        required:true
    },
    address:{type:String,
        required:true
    },
    time:{type:String,
        required:true
    },
    
});
const Booking = mongoose.model("Booking", ServiceSchemaB);
module.exports = Booking;
   