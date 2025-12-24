import { Router } from "express";
import secureRoute from "../middleware/secureRoute.js";
import {addNewBlock} from "../controllers/block.controller.js"

const router = Router();

router.post("/add-block", secureRoute, addNewBlock);

export default router;















