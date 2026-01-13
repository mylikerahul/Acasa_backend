// import express from 'express';
// import * as SubscribesController from '../../../controllers/admin/Subscribe/Subscribe.controller.js';
// import { isAdminAuthenticated } from '../../../guards/guards.js';

// const router = express.Router();

// // ==================== PUBLIC ROUTES ====================
// router.post('/', SubscribesController.subscribe);
// router.post('/unsubscribe', SubscribesController.unsubscribe);

// // ==================== ADMIN ROUTES ====================
// router.get('/subscribers', isAdminAuthenticated, SubscribesController.getAllSubscribers);
// router.get('/subscribers/:id/status', isAdminAuthenticated, SubscribesController.updateSubscriberStatus);
// router.delete('/subscribers/:id', isAdminAuthenticated, SubscribesController.deleteSubscriber);
// router.post('/newsletter/send', isAdminAuthenticated, SubscribesController.sendNewsletter);

// export default router;