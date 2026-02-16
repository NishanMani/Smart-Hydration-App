import express from 'express'
import * as analyticsController from '../controllers/analyticsController.js'//gave in common 
import { protect } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/weekly', protect, analyticsController.getWeeklyAnalytics)
router.get('/monthly', protect, analyticsController.getMonthlyAnalytics)         //Object-based route
router.get('/streak', protect, analyticsController.getStreakAnalytics)
router.get('/performance', protect, analyticsController.getPerformance)
router.get('/trend', protect, analyticsController.getTrendAnalytics)

export default router;
