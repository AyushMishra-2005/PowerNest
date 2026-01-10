import { Router } from 'express'
import secureRoute from '../middleware/secureRoute.js';
import { addPin, getData, removeConnection, blockConnection, getUsageData } from '../controllers/esp.controller.js'

const router = Router();


router.post("/add-pin", secureRoute, addPin);
router.post("/get-esp-data", secureRoute, getData);
router.post("/remove-connection", secureRoute, removeConnection);
router.post("/block-connection", secureRoute, blockConnection);
router.post("/get-room-data", secureRoute, getUsageData);

export default router;














