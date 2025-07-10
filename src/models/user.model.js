import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

//Define User Schema
const userSchema = new mongoose.Schema(
    {
        name : { type : String , required : true },
        email: { type: String, unique: true, required: true, index: true,
            match:/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g
        },
        password : { type : String , required : true , default : null },
        isVerified : { type : Boolean , default : false} ,
        refreshToken : { type : String , default : null},
        googleRefreshToken : { type : String , default : null},
        githubRefreshToken : { type : String , default : null},
        profileURL : { type : String , default : null},

    },{
        timestamps: true
    }
);

// Pre hooks
userSchema.pre("save",async function (next){
  if(!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password,salt);
  next();
});

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