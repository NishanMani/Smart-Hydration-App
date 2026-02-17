import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    },
    weight : {
        type : Number
        // required : true
    },
    height : {
        type :Number
        // required : true
    },
    age : {
        type : Number
        // required : true
    },
    gender : {
        type : String
        // required : true
    },
    activityLevel : {
        type : String
        // required : true
    },
    climate : {
        type : String
        // required : true
    },
    lifestyle : {
        type : String
        // required : true
    },
    dailyGoal : {
        type : Number
        // required : true
    },
    unit : {
        type : String, enum : ['ml', 'oz'],
        // required : true
    },
    pregnant : {
        type : Boolean
        // required : true
    },
    breastfeeding : {
        type : Boolean
        // required : true      
    },
    refreshToken : {
        type : String
    } 

}, { timestamps: true })

const User = mongoose.model('User',userSchema)

export default User
