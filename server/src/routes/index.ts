import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import {
  createCall,
  endCallHandler,
  getCall,
  getCalls,
  healthCheck,
  linkCallSid,
} from '../controllers/callController.js';
import { getPhoneNumbers, getToken } from '../controllers/twilioController.js';
import { handleStatus, handleVoice } from '../controllers/twilioWebhookController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateTwilioSignature } from '../middleware/validateTwilioSignature.js';

const router = Router();

router.get('/health', healthCheck);

router.post('/auth/login', login);

router.post('/twilio/voice', validateTwilioSignature, handleVoice);
router.post('/twilio/status', validateTwilioSignature, handleStatus);

router.use(requireAuth);

router.get('/auth/me', me);
router.get('/twilio/token', getToken);
router.get('/twilio/phone-numbers', getPhoneNumbers);

router.post('/calls', createCall);
router.patch('/calls/:callId/sid', linkCallSid);
router.get('/calls', getCalls);
router.get('/calls/:callSid', getCall);
router.post('/calls/:callSid/end', endCallHandler);

export default router;
