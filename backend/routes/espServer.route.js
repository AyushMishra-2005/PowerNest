import { Router } from 'express'
import { findRoomEspId } from '../controllers/espServer.controller.js'

const router = Router();

router.post("/get-roomId", findRoomEspId);


export default router;














