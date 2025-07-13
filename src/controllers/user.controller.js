import { asyncHandler } from "../utils/asynchandler.js";
import { APIError , APIResponse} from "../utils/apiResponse.js";
import { google }  from 'googleapis';
import { oauth2Client } from "../auth/google.js";
import User from "../models/user.model.js";
import url from 'url';
import axios from 'axios';


const options = {
httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax', // Use 'None' if cross-origin and using secure cookies
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
// Function that generate access and refresh token
const generateAccessTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        return { accessToken };

    } catch (error) {
        throw new APIError(500, "Went Wrong while generating access token");
    }
}

/**
* Register a new user using Google.
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

            const {email , name , picture , verified_email} = userinfo.data;

            const user = await User.create({
                name,
                email,
                isVerified : verified_email,
                profileURL : picture,
                googleRefreshToken,
            });
            const { accessToken } = generateAccessTokens(user._id)
            
            const createdUser =  await User.findById(user._id).select("-password -googleRefreshToken -githubAccessToken");

            console.log(createdUser);

            return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .json(
                    new APIResponse(
                        200,
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

/**
* Register a new user using GitHub.
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/

const registerUserGitHub = asyncHandler(async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code provided');

  try {
    // Step 1: Exchange code for access token
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const access_token = tokenRes.data.access_token;
    if (!access_token) return res.status(401).send('Access token not received');

    // Step 2: Fetch GitHub profile
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${access_token}` },
    });

    // Step 3: Fetch verified primary email
    const emailRes = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `token ${access_token}` },
    });

    const emails = emailRes.data;
    const primaryEmail = emails.find(e => e.primary && e.verified);
    if (!primaryEmail) return res.status(403).send('No verified primary email found');

    const { email, verified } = primaryEmail;
    const { name, avatar_url } = userRes.data;

    // Step 4: Create or update user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        isVerified: verified,
        profileURL: avatar_url,
        githubAccessToken: access_token,
      });
    } else {
      user.githubAccessToken = access_token;
      if (!user.isVerified) user.isVerified = verified;
      user.profileURL = avatar_url;
      await user.save();
    }

    // Step 5: Generate tokens
    const { accessToken } = generateAccessTokens(user._id);
    const userSafe = await User.findById(user._id).select(
      '-password -googleRefreshToken -githubAccessToken'
    );

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(
        new APIResponse(
          200,
          'User successfully authenticated via GitHub'
        )
      );
  } catch (err) {
    console.error('GitHub OAuth error:', err.response?.data || err.message);
    res.status(500).send('GitHub OAuth failed');
  }
});


/**
* Fetch User Details for Profile.
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/
const userDetails = asyncHandler (async(req,res)=>{
    let user = req.user; // user details from auth middleware without password google-github-tokens

    if(!user){
      throw new APIError(404,"User Not Found")
    }

    const userdetail = {
      name : user.name,
      email : user.email,
      isVerified : user.isVerified,
      profileURL : user.profileURL
    }
    return res
    .status(200)
    .json(
      new APIResponse(
        200,
        userdetail,
        "User Details Successfully fetched."
      )
    )
});

/**
* Logout the User
* @param {Object} req - Express request object.
* @param {Object} res - Express response object.
*/
const logoutUser = asyncHandler(async (req, res) => {

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .json(new APIResponse(200, {}, "User Logged Out"));

});

export {
    registerUserGoogle,
    registerUserGitHub,
    userDetails,
    logoutUser
}