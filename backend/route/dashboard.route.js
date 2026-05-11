import express from 'express'
import { getDueDatesForStudent } from '../controler/dashboard/getduedates.js'
import { getTeacherDashboard } from '../controler/dashboard/getTeacherDashboard.js'
const router = express.Router();

router.get("/getduedate/:studentId", getDueDatesForStudent)
router.get("/teacher/:teacherId", getTeacherDashboard)
  
export default router;