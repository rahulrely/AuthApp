import mongoose from "mongoose";
import jwt from "jsonwebtoken";

//Define User Schema
const userSchema = new mongoose.Schema(
    {
        name : { type : String , required : true },
        email: { type: String, unique: true, required: true, index: true,
            match:/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g
        },
        isVerified : { type : Boolean , default : false} ,
        refreshToken : { type : String , default : null},
        googleRefreshToken : { type : String , default : null},
        githubAccessToken : { type : String , default : null},
        profileURL : { type : String , default : null},

    },{
        timestamps: true
    }
);

userSchema.methods.generateAccessToken = function (){
  return jwt.sign(
    { _id: this._id, email: this.email,name :this.name},
    process.env.SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function (){
  return jwt.sign(
    { _id: this._id },
    process.env.SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY } 
  );
};

// Export User Model
const User = mongoose.model("User", userSchema);
export default User;