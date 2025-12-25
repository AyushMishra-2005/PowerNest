import {Router} from 'express'
import secureRoute from '../middleware/secureRoute.js';
import {addPin} from '../controllers/esp.controller.js'

const router = Router();


router.post("/add-pin", secureRoute, addPin);


export default router;














