import mongoose from "mongoose";


export default async function connectDB(){
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${process.env.DB_NAME}`);
        
        console.log(`\n MongoDB Connected !! DB HOST : ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log("Error with DB Connection",error);
        process.exit(1);
    }
}