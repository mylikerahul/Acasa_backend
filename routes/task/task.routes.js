import express from 'express';
import * as TasksController from '../../controllers/task/task.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Get all tasks
router.get('/', TasksController.getAllTasks);

// Get recent tasks
router.get('/recent', TasksController.getRecentTasks);

// Search tasks
router.get('/search', TasksController.searchTasks);

// Get tasks by date range
router.get('/date-range', TasksController.getTasksByDateRange);

// Get tasks by assignee
router.get('/assignee/:assignee', TasksController.getTasksByAssignee);

// Get task by ID
router.get('/:id', TasksController.getTaskById);

// Get task by slug
router.get('/slug/:slug', TasksController.getTaskBySlug);

// ==================== ADMIN PROTECTED ROUTES ====================

// Create new task (admin only)
router.post(
  '/',
  isAuthenticated,
  isAdmin,
  TasksController.createTask
);

// Update task by ID (admin only)
router.put(
  '/:id',
  isAuthenticated,
  isAdmin,
  TasksController.updateTask
);

// Delete task by ID (admin only)
router.delete(
  '/:id',
  isAuthenticated,
  isAdmin,
  TasksController.deleteTask
);

export default router;