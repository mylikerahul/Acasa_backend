import * as TaskModel from '../../models/task/task.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== CREATE TASK ====================
export const createTask = catchAsyncErrors(async (req, res, next) => {
  const {
    Commission,
    assign,
    date,
    title,
    slug,
    descriptions,
    heading,
    seo_title,
    seo_keywork,
    seo_description
  } = req.body;

  // Validate - at least title or heading required
  if (!title && !heading) {
    return next(new ErrorHandler('Title or heading is required', 400));
  }

  // Check if slug already exists (if provided)
  if (slug) {
    const existingTask = await TaskModel.getTaskBySlug(slug);
    if (existingTask) {
      return next(new ErrorHandler('Task with this slug already exists', 400));
    }
  }

  const taskData = {
    Commission: Commission || null,
    assign: assign || null,
    date: date || new Date().toISOString().split('T')[0],
    title: title || null,
    slug: slug || null,
    descriptions: descriptions || null,
    heading: heading || null,
    seo_title: seo_title || null,
    seo_keywork: seo_keywork || null,
    seo_description: seo_description || null
  };

  const result = await TaskModel.createTask(taskData);
  const newTask = await TaskModel.getTaskById(result.insertId);

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: newTask
  });
});

// ==================== GET ALL TASKS ====================
export const getAllTasks = catchAsyncErrors(async (req, res, next) => {
  const tasks = await TaskModel.getAllTasks();

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// ==================== GET TASK BY ID ====================
export const getTaskById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Please provide a valid task ID', 400));
  }

  const task = await TaskModel.getTaskById(parseInt(id));

  if (!task) {
    return next(new ErrorHandler('Task not found', 404));
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// ==================== GET TASK BY SLUG ====================
export const getTaskBySlug = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;

  if (!slug) {
    return next(new ErrorHandler('Please provide a slug', 400));
  }

  const task = await TaskModel.getTaskBySlug(slug);

  if (!task) {
    return next(new ErrorHandler('Task not found', 404));
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// ==================== UPDATE TASK ====================
export const updateTask = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const {
    Commission,
    assign,
    date,
    title,
    slug,
    descriptions,
    heading,
    seo_title,
    seo_keywork,
    seo_description
  } = req.body;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Please provide a valid task ID', 400));
  }

  // Check if task exists
  const existingTask = await TaskModel.getTaskById(parseInt(id));
  if (!existingTask) {
    return next(new ErrorHandler('Task not found', 404));
  }

  // Check if slug already exists for another task
  if (slug && slug !== existingTask.slug) {
    const taskWithSlug = await TaskModel.getTaskBySlug(slug);
    if (taskWithSlug && taskWithSlug.id !== parseInt(id)) {
      return next(new ErrorHandler('Another task with this slug already exists', 400));
    }
  }

  const updateData = {
    Commission: Commission !== undefined ? Commission : existingTask.Commission,
    assign: assign !== undefined ? assign : existingTask.assign,
    date: date || existingTask.date,
    title: title !== undefined ? title : existingTask.title,
    slug: slug !== undefined ? slug : existingTask.slug,
    descriptions: descriptions !== undefined ? descriptions : existingTask.descriptions,
    heading: heading !== undefined ? heading : existingTask.heading,
    seo_title: seo_title !== undefined ? seo_title : existingTask.seo_title,
    seo_keywork: seo_keywork !== undefined ? seo_keywork : existingTask.seo_keywork,
    seo_description: seo_description !== undefined ? seo_description : existingTask.seo_description
  };

  await TaskModel.updateTask(parseInt(id), updateData);
  const updatedTask = await TaskModel.getTaskById(parseInt(id));

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: updatedTask
  });
});

// ==================== DELETE TASK ====================
export const deleteTask = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return next(new ErrorHandler('Please provide a valid task ID', 400));
  }

  const existingTask = await TaskModel.getTaskById(parseInt(id));
  if (!existingTask) {
    return next(new ErrorHandler('Task not found', 404));
  }

  await TaskModel.deleteTask(parseInt(id));

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully'
  });
});

// ==================== SEARCH TASKS ====================
export const searchTasks = catchAsyncErrors(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new ErrorHandler('Please provide a search query', 400));
  }

  const tasks = await TaskModel.searchTasks(query);

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// ==================== GET TASKS BY ASSIGNEE ====================
export const getTasksByAssignee = catchAsyncErrors(async (req, res, next) => {
  const { assignee } = req.params;

  if (!assignee) {
    return next(new ErrorHandler('Please provide an assignee', 400));
  }

  const tasks = await TaskModel.getTasksByAssignee(assignee);

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// ==================== GET TASKS BY DATE RANGE ====================
export const getTasksByDateRange = catchAsyncErrors(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(new ErrorHandler('Please provide both start and end dates', 400));
  }

  const tasks = await TaskModel.getTasksByDateRange(startDate, endDate);

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// ==================== GET RECENT TASKS ====================
export const getRecentTasks = catchAsyncErrors(async (req, res, next) => {
  const { limit = 5 } = req.query;

  const tasks = await TaskModel.getRecentTasks(parseInt(limit));

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});