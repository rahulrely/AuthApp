import {
    registerUserGoogle,
    registerUserGitHub,
    userDetails,
    logoutUser,
} from "../controllers/user.controller.js";
import { verifyJwt } from "../auth.middleware.js"
import { genGoogleURL } from "../auth/google.js";
import { genGitHubURL } from "../auth/github.js";

import { Router } from "express";

const router = Router();

router.get("/google",genGoogleURL);
router.get("/github",genGitHubURL);

router.get("/auth/google",registerUserGoogle);// http://localhost:7000/api/v1/users/auth/google
router.get("/auth/github",registerUserGitHub);// http://localhost:7000/api/v1/users/auth/github


// #Secured Routes
router.get("/profile",verifyJwt,userDetails);
router.get("/logout",verifyJwt,logoutUser)


export default router;