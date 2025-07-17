import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from 'express-session';
const app = express();

if (!process.env.SECRET || !process.env.MONGO_URI) {
  console.error("Missing required env vars: EXPRESS_SESSION_SECRET or MONGO_URI");
}

app.set('trust proxy', 1);
const allowedOrigins = [process.env.CORS_ORIGIN,"http://localhost:5173"];
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true // Important for sending cookies with cross-origin requests
}));

app.get('/', (req, res) => { //verification for beckend and frontend connections
    res.json({ message: 'Auth App Backend is Connected with You !' });
  });

app.use(express.json({
    limit:"20kb"
}));

app.use(express.urlencoded({extended:true , limit :"16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

app.use(session({
    secret: process.env.SECRET, // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
}));

// //routes import
import userRouter  from "./routes/user.route.js"

//routes declarations
app.use("/api/v1/users",userRouter);      // http://localhost:7000/api/v1/users
// app.use("/api/v1/dashboard",dashboardRouter);

export {app} ;