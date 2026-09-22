import { Router } from 'express'
import { findRoomEspId, getActivePins, receiveTelemetry} from '../controllers/espServer.controller.js'

const router = Router();

router.post("/get-roomId", findRoomEspId);
router.post("/get-active-pins", getActivePins);
router.post("/telemetry", receiveTelemetry);

export default router;














