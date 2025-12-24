import { Router } from "express";
import secureRoute from "../middleware/secureRoute.js";
import {addNewBlock, allBlockData} from "../controllers/block.controller.js"

const router = Router();

router.post("/add-block", secureRoute, addNewBlock);
router.post("/get-blocks", secureRoute, allBlockData);

export default router;















