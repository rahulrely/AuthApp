import { asyncHandler } from "../utils/asynchandler.js";
import crypto from "crypto";

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const REDIRECT_URI = process.env.GITHUB_REDIRECT_URL;

// Step 1: Redirect user to GitHub login
const genGitHubURL = asyncHandler((req, res) => {
  const state = crypto.randomBytes(32).toString('hex');
  // Store state in the session
  req.session.state = state;
  const githubURL = `https://github.com/login/oauth/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&state=${state}`+
    `&scope=user`+
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`+
    `&allow_signup=false`;

  res.redirect(githubURL);
});
export {
  genGitHubURL,
};