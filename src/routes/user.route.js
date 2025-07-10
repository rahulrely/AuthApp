import {
    registerUserGoogle
} from "../controllers/user.js";
import { genGoogleURL } from "../auth/google.js";

import { Router } from "express";

const router = Router();

router.get("/google",genGoogleURL);

router.get("/googlecb",registerUserGoogle);


export default router;