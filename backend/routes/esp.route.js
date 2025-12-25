import { Router } from 'express'
import secureRoute from '../middleware/secureRoute.js';
import { addPin, getData } from '../controllers/esp.controller.js'

const router = Router();


router.post("/add-pin", secureRoute, addPin);
router.post("/get-esp-data", secureRoute, getData);


export default router;














