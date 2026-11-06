const express = require('express');
const webhook = require('../controllers/webhookController');
const verifyWebhookAuth = require('../middleware/webhookAuth');

const router = express.Router();

// Server-to-server listing feed (CRM / partner systems), guarded by WEBHOOK_AUTH_KEY.
router.post('/listings', verifyWebhookAuth, webhook.receiveListings);
router.delete('/listings/:propertyId', verifyWebhookAuth, webhook.removeListing);

module.exports = router;
