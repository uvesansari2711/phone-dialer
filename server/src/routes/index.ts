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
import {
  getConversations,
  getMessages,
  markRead,
  sendMessage,
} from '../controllers/messageController.js';
import {
  handleIncomingSms,
  handleSmsStatus,
  handleStatus,
  handleVoice,
} from '../controllers/twilioWebhookController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateTwilioSignature } from '../middleware/validateTwilioSignature.js';

const router = Router();

router.get('/health', healthCheck);

router.post('/auth/login', login);

router.post('/twilio/voice', validateTwilioSignature, handleVoice);
router.post('/twilio/status', validateTwilioSignature, handleStatus);
router.post('/twilio/sms', validateTwilioSignature, handleIncomingSms);
router.post('/twilio/sms-status', validateTwilioSignature, handleSmsStatus);

router.use(requireAuth);

router.get('/auth/me', me);
router.get('/twilio/token', getToken);
router.get('/twilio/phone-numbers', getPhoneNumbers);

router.post('/calls', createCall);
router.patch('/calls/:callId/sid', linkCallSid);
router.get('/calls', getCalls);
router.get('/calls/:callSid', getCall);
router.post('/calls/:callSid/end', endCallHandler);

router.post('/messages', sendMessage);
router.get('/messages', getMessages);
router.get('/conversations', getConversations);
router.post('/conversations/:number/read', markRead);

export default router;
