import {
    registerUserGoogle
} from "../controllers/user.js";
import { genGoogleURL } from "../auth/google.js";

import { Router } from "express";

const router = Router();

router.get("/google",genGoogleURL);

router.get("/auth/google",registerUserGoogle); // http://localhost:7000/api/v1/users/auth/google


export default router;