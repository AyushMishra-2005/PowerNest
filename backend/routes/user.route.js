import {Router} from 'express'
import {signup, login, logout, sendOtp, verifyOtp} from '../controllers/user.controller.js'
import secureRoute from '../middleware/secureRoute.js';
import validateOTP from '../middleware/validateOTP.js';
import verifyGoogleToken from '../middleware/verifyGoogleToken.js';

const router = Router();

router.post('/signup',verifyGoogleToken, validateOTP, signup);
router.post('/login', verifyGoogleToken, validateOTP, login);
router.post('/logout', secureRoute, logout);
router.post('/sendOTP', sendOtp);
router.post('/verifyOTP', verifyOtp);

export default router;

























