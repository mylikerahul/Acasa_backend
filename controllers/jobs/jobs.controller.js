// controllers/jobs/jobs.controller.js

import * as JobsModel from '../../models/jobs/jobs.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

/* =========================================================
   GET JOBS DYNAMIC (Main Listing Endpoint)
========================================================= */

export const getJobsDynamic = catchAsyncErrors(async (req, res, next) => {
  const {
    page,
    limit,
    search,
    status,
    type,
    city,
    featured,
    urgent,
    salaryMin,
    salaryMax,
    experienceMin,
    experienceMax,
    sortBy,
    sortOrder,
    dateFrom,
    dateTo
  } = req.query;

  const result = await JobsModel.getJobsDynamic({
    page: page || 1,
    limit: limit || 10,
    search,
    status,
    type,
    city,
    featured,
    urgent,
    salaryMin,
    salaryMax,
    experienceMin,
    experienceMax,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'DESC',
    dateFrom,
    dateTo
  });

  res.status(200).json({
    success: true,
    ...result
  });
});

/* =========================================================
   GET JOB STATS
========================================================= */

export const getJobStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await JobsModel.getJobStats();

  res.status(200).json({
    success: true,
    data: stats
  });
});

/* =========================================================
   GET FILTER OPTIONS
========================================================= */

export const getFilterOptions = catchAsyncErrors(async (req, res, next) => {
  const options = await JobsModel.getFilterOptions();

  res.status(200).json({
    success: true,
    data: options
  });
});

/* =========================================================
   CREATE JOB
========================================================= */

export const createJob = catchAsyncErrors(async (req, res, next) => {
  const { title, job_title, slug } = req.body;

  if (!title && !job_title) {
    return next(new ErrorHandler('Title or Job Title is required', 400));
  }

  // Generate slug if not provided
  let finalSlug = slug;
  if (!finalSlug) {
    const baseSlug = (title || job_title).toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    finalSlug = await JobsModel.generateUniqueSlug(baseSlug);
  } else {
    const slugExists = await JobsModel.checkSlugExists(finalSlug);
    if (slugExists) {
      return next(new ErrorHandler('Slug already exists', 400));
    }
  }

  const jobData = {
    ...req.body,
    slug: finalSlug,
    status: req.body.status || 'active',
    views: 0,
    applications: 0
  };

  const result = await JobsModel.createJob(jobData);

  res.status(201).json({
    success: true,
    message: 'Job created successfully',
    data: { id: result.insertId, ...jobData }
  });
});

/* =========================================================
   GET JOB BY ID
========================================================= */

export const getJobById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const job = await JobsModel.getJobById(id);

  if (!job) {
    return next(new ErrorHandler('Job not found', 404));
  }

  res.status(200).json({
    success: true,
    data: job
  });
});

/* =========================================================
   GET JOB BY SLUG
========================================================= */

export const getJobBySlug = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;
  const job = await JobsModel.getJobBySlug(slug);

  if (!job) {
    return next(new ErrorHandler('Job not found', 404));
  }

  // Increment views for public access
  if (!req.isAdmin) {
    await JobsModel.incrementViews(job.id);
    job.views = (job.views || 0) + 1;
  }

  res.status(200).json({
    success: true,
    data: job
  });
});

/* =========================================================
   UPDATE JOB
========================================================= */

export const updateJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingJob = await JobsModel.getJobById(id);
  if (!existingJob) {
    return next(new ErrorHandler('Job not found', 404));
  }

  // Check slug uniqueness if updating
  if (req.body.slug && req.body.slug !== existingJob.slug) {
    const slugExists = await JobsModel.checkSlugExists(req.body.slug, id);
    if (slugExists) {
      return next(new ErrorHandler('Slug already exists', 400));
    }
  }

  await JobsModel.updateJob(id, req.body);
  const updatedJob = await JobsModel.getJobById(id);

  res.status(200).json({
    success: true,
    message: 'Job updated successfully',
    data: updatedJob
  });
});

/* =========================================================
   INLINE UPDATE (Quick Update)
========================================================= */

export const inlineUpdate = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { field, value } = req.body;

  if (!field) {
    return next(new ErrorHandler('Field is required', 400));
  }

  const allowedFields = ['title', 'job_title', 'status', 'type', 'city_name', 'featured', 'urgent'];
  if (!allowedFields.includes(field)) {
    return next(new ErrorHandler('Field not allowed for inline update', 400));
  }

  const existingJob = await JobsModel.getJobById(id);
  if (!existingJob) {
    return next(new ErrorHandler('Job not found', 404));
  }

  await JobsModel.updateJob(id, { [field]: value });
  const updatedJob = await JobsModel.getJobById(id);

  res.status(200).json({
    success: true,
    message: `${field} updated successfully`,
    data: updatedJob
  });
});

/* =========================================================
   UPDATE JOB STATUS
========================================================= */

export const updateJobStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return next(new ErrorHandler('Status is required', 400));
  }

  const validStatuses = ['active', 'inactive', 'closed', 'draft'];
  if (!validStatuses.includes(status)) {
    return next(new ErrorHandler('Invalid status', 400));
  }

  const existingJob = await JobsModel.getJobById(id);
  if (!existingJob) {
    return next(new ErrorHandler('Job not found', 404));
  }

  await JobsModel.updateJobStatus(id, status);

  res.status(200).json({
    success: true,
    message: 'Status updated successfully',
    data: { id: parseInt(id), status }
  });
});

/* =========================================================
   TOGGLE JOB STATUS
========================================================= */

export const toggleJobStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingJob = await JobsModel.getJobById(id);
  if (!existingJob) {
    return next(new ErrorHandler('Job not found', 404));
  }

  await JobsModel.toggleJobStatus(id);
  const newStatus = existingJob.status === 'active' ? 'inactive' : 'active';

  res.status(200).json({
    success: true,
    message: `Status changed to ${newStatus}`,
    data: { id: parseInt(id), status: newStatus }
  });
});

/* =========================================================
   TOGGLE FEATURED
========================================================= */

export const toggleFeatured = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingJob = await JobsModel.getJobById(id);
  if (!existingJob) {
    return next(new ErrorHandler('Job not found', 404));
  }

  await JobsModel.toggleFeatured(id);
  const newFeatured = !existingJob.featured;

  res.status(200).json({
    success: true,
    message: newFeatured ? 'Job marked as featured' : 'Job removed from featured',
    data: { id: parseInt(id), featured: newFeatured }
  });
});

/* =========================================================
   DELETE JOB
========================================================= */

export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingJob = await JobsModel.getJobById(id);
  if (!existingJob) {
    return next(new ErrorHandler('Job not found', 404));
  }

  await JobsModel.deleteJob(id);

  res.status(200).json({
    success: true,
    message: 'Job deleted successfully',
    data: { id: parseInt(id) }
  });
});

/* =========================================================
   BULK UPDATE STATUS
========================================================= */

export const bulkUpdateStatus = catchAsyncErrors(async (req, res, next) => {
  const { ids, status } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('Job IDs array is required', 400));
  }

  if (!status) {
    return next(new ErrorHandler('Status is required', 400));
  }

  const result = await JobsModel.bulkUpdateStatus(ids, status);

  res.status(200).json({
    success: true,
    message: `${result.affectedRows} jobs updated to ${status}`,
    data: { affectedRows: result.affectedRows }
  });
});

/* =========================================================
   BULK UPDATE FEATURED
========================================================= */

export const bulkUpdateFeatured = catchAsyncErrors(async (req, res, next) => {
  const { ids, featured } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('Job IDs array is required', 400));
  }

  const result = await JobsModel.bulkUpdateFeatured(ids, featured);

  res.status(200).json({
    success: true,
    message: `${result.affectedRows} jobs updated`,
    data: { affectedRows: result.affectedRows }
  });
});

/* =========================================================
   BULK DELETE JOBS
========================================================= */

export const bulkDeleteJobs = catchAsyncErrors(async (req, res, next) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(new ErrorHandler('Job IDs array is required', 400));
  }

  const result = await JobsModel.bulkDeleteJobs(ids);

  res.status(200).json({
    success: true,
    message: `${result.affectedRows} jobs deleted`,
    data: { affectedRows: result.affectedRows }
  });
});

/* =========================================================
   DUPLICATE JOB
========================================================= */

export const duplicateJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const result = await JobsModel.duplicateJob(id);

  if (!result) {
    return next(new ErrorHandler('Job not found', 404));
  }

  res.status(201).json({
    success: true,
    message: 'Job duplicated successfully',
    data: result
  });
});

/* =========================================================
   CHECK SLUG AVAILABILITY
========================================================= */

export const checkSlugAvailability = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;
  const { exclude_id } = req.query;

  const exists = await JobsModel.checkSlugExists(slug, exclude_id || null);

  res.status(200).json({
    success: true,
    available: !exists,
    message: exists ? 'Slug already taken' : 'Slug is available'
  });
});

/* =========================================================
   GET ACTIVE JOBS (Public)
========================================================= */

export const getActiveJobs = catchAsyncErrors(async (req, res, next) => {
  const result = await JobsModel.getActiveJobs(req.query);

  res.status(200).json({
    success: true,
    ...result
  });
});

/* =========================================================
   GET RECENT JOBS
========================================================= */

export const getRecentJobs = catchAsyncErrors(async (req, res, next) => {
  const { limit } = req.query;
  const jobs = await JobsModel.getRecentJobs(limit || 10);

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

/* =========================================================
   CREATE JOBS TABLE
========================================================= */

export const createJobsTable = catchAsyncErrors(async (req, res, next) => {
  await JobsModel.createJobsTable();

  res.status(200).json({
    success: true,
    message: 'Jobs table created successfully'
  });
});