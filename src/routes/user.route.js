import {
    registerUserGoogle,
    registerUserGitHub
} from "../controllers/user.controller.js";
import { genGoogleURL } from "../auth/google.js";
import { genGitHubURL } from "../auth/github.js";

import { Router } from "express";

const router = Router();

router.get("/google",genGoogleURL);
router.get("/github",genGitHubURL);

router.get("/auth/google",registerUserGoogle);// http://localhost:7000/api/v1/users/auth/google
router.get("/auth/github",registerUserGitHub);// http://localhost:7000/api/v1/users/auth/github


export default router;