import User from "./models/user.model.js";
import { APIError } from "./utils/apiResponse.js";
import { asyncHandler } from "./utils/asyncHandler.js";
// import { asyncHandler } from ".././utils/asyncHandler.js";
import jwt  from "jsonwebtoken";

export const verifyJwt = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");  // second for mobile apps
    if (!token) {
        throw new APIError(401, "Unauthorized Request");
    }
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.SECRET);
    } catch (error) {
        throw new APIError(401, "Invalid or Expired Access Token");
    }
    const user = await User.findById(decodedToken?._id).select("-password -googleRefreshToken -githubAccessToken");
    if (!user) {
        throw new APIError(401, "Invalid Access Token");
    }
    req.user = user;
    next();
});