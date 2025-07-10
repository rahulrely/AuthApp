import { asyncHandler } from "../utils/asynchandler.js";
import { APIError , APIResponse} from "../utils/apiResponse.js";
import { google }  from 'googleapis';
import { oauth2Client } from "../auth/google.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import url from 'url';
// Function that generate access and refresh token
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); // Save the new refresh token

        return { accessToken, refreshToken };

    } catch (error) {
        throw new APIError(500, "Went Wrong while generating refresh and access token");
    }
}

/**
* Register a new user using  Google.
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/
const registerUserGoogle = asyncHandler(async(req,res)=>{
    try {
        // Log received session data for debugging
        console.log("googleLink - req.session.state:", req.session?.state);
        console.log("googleLink - req.query.state:", req.query?.state);

        // Handle the OAuth 2.0 server response
        let q = url.parse(req.url, true).query;

        console.log("url query received:", q);

        if (q.error) { // An error response e.g. error=access_denied
            console.error('Google OAuth Error:' + q.error);
            throw new APIError(400, `Google OAuth Error: ${q.error}`);
        }
        // CSRF State verification
        else if (q.state !== req.session.state) { // Verify state value
            console.error('State mismatch. Possible CSRF attack. Expected:', req.session.state, 'Received:', q.state);
            throw new APIError(403, 'State mismatch. Possible CSRF attack.');
        } else { // Get access and refresh tokens (if access_type is offline)
            let { tokens } = await oauth2Client.getToken(q.code);
            oauth2Client.setCredentials(tokens);
            
            console.log("googleToken received:", tokens);
            
            const googleRefreshToken = tokens?.refresh_token;
            const googleAccessToken = tokens?.access_token;
            
            oauth2Client.setCredentials({ access_token : googleAccessToken });

            const oauth2 = google.oauth2({
            version: 'v2',
                auth: oauth2Client 
            });
            
            const userinfo = await oauth2.userinfo.get();
            console.log(userinfo.data);

            const {id, email , name , picture , verified_email} = userinfo.data;

            const user = await User.create({
                name,
                email,
                password : id,
                isVerified : verified_email,
                profileURL : picture,
                googleRefreshToken
            });
            const {accessToken ,refreshToken} = generateAccessAndRefreshTokens(user._id)
            
            const createdUser =  await User.findById(user._id).select("-password -refreshToken -googleRefreshToken -githubRefreshToken");

            console.log(createdUser);

            const options = {
                httpOnly: true,
                secure: true, 
            };
            return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json(
                    new APIResponse(
                        200,
                        createdUser,
                        "User Succesfully Created and Authenticated"
                    )
                )
                // .redirect(`${process.env.DOMAIN}?linked=true`);
        }
    } catch (error) {
        console.error("Error In Google Linking:", error);
        // Redirect to a frontend error page with a helpful message
        const errorMessage = error instanceof APIError ? error.message : "An unexpected error occurred during Google linking.";
        const statusCode = error instanceof APIError ? error.statusCode : 500;
        return res
        .status(statusCode)
        // .redirect(`${process.env.DOMAIN}?error=${encodeURIComponent(errorMessage)}`);
    }
});

export {
    registerUserGoogle,
}