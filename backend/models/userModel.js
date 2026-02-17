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
    },
    height : {
        type :Number
    },
    age : {
        type : Number
    },
    gender : {
        type : String
    },
    activityLevel : {
        type : String
    },
    climate : {
        type : String
    },
    lifestyle : {
        type : String
    },
    dailyGoal : {
        type : String
    },
    unit : {
        type : String, enum : ['ml', 'oz']
    },
    pregnant : {
        type : Boolean
    },
    breastfeeding : {
        type : Boolean      
    },
    refreshToken : {
        type : String
    } 

}, { timestamps: true })

const User = mongoose.model('User',userSchema)

export default User
