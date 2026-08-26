import { Router } from 'express';
import {
  createCall,
  endCallHandler,
  getCall,
  getCalls,
  healthCheck,
  linkCallSid,
} from '../controllers/callController.js';
import { getToken } from '../controllers/twilioController.js';
import { handleStatus, handleVoice } from '../controllers/twilioWebhookController.js';
import { validateTwilioSignature } from '../middleware/validateTwilioSignature.js';

const router = Router();

router.get('/health', healthCheck);

router.get('/twilio/token', getToken);

router.post('/twilio/voice', validateTwilioSignature, handleVoice);
router.post('/twilio/status', validateTwilioSignature, handleStatus);

router.post('/calls', createCall);
router.patch('/calls/:callId/sid', linkCallSid);
router.get('/calls', getCalls);
router.get('/calls/:callSid', getCall);
router.post('/calls/:callSid/end', endCallHandler);

export default router;
