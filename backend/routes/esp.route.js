import { Router } from 'express'
import secureRoute from '../middleware/secureRoute.js';
import { addPin, getData, removeConnection, blockConnection, getUsageData, toggleConnection } from '../controllers/esp.controller.js'

const router = Router();


router.post("/add-pin", secureRoute, addPin);
router.post("/get-esp-data", secureRoute, getData);
router.post("/remove-connection", secureRoute, removeConnection);
router.post("/block-connection", secureRoute, blockConnection);
router.post("/get-room-data", secureRoute, getUsageData);
router.post("/toggle-connection", secureRoute, toggleConnection);

export default router;














