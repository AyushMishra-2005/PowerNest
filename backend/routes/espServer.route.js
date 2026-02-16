import { Router } from 'express'
import { findRoomEspId, getActivePins } from '../controllers/espServer.controller.js'

const router = Router();

router.post("/get-roomId", findRoomEspId);
router.post("/get-active-pins", getActivePins);

export default router;














