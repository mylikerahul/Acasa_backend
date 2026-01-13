import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import * as JobsModel from '../../models/jobs/jobs.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/* =========================================================
   CREATE JOB
========================================================= */

export const createJob = catchAsyncErrors(async (req, res, next) => {
  const {
    full_name, title, description, sub_title, sub_description,
    about_team, about_company, job_title, city_name, responsibilities,
    type, link, facilities, social, seo_title, seo_description,
    seo_keyword, status, slug
  } = req.body;

  // Validation
  if (!title || !job_title) {
    return next(new ErrorHandler('Title and Job Title are required', 400));
  }

  // Generate unique slug if not provided
  let finalSlug = slug;
  if (!finalSlug) {
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    finalSlug = await JobsModel.generateUniqueSlug(baseSlug);
  } else {
    // Check if slug already exists
    const slugExists = await JobsModel.checkSlugExists(finalSlug);
    if (slugExists) {
      return next(new ErrorHandler('Slug already exists', 400));
    }
  }

  const jobData = {
    full_name,
    title,
    description,
    sub_title,
    sub_description,
    about_team,
    about_company,
    job_title,
    city_name,
    responsibilities,
    type,
    link,
    facilities,
    social,
    seo_title,
    seo_description,
    seo_keyword,
    status: status || 'active',
    slug: finalSlug
  };

  const result = await JobsModel.createJob(jobData);

  res.status(201).json({
    success: true,
    message: 'Job created successfully',
    data: {
      id: result.insertId,
      ...jobData
    }
  });
});

/* =========================================================
   GET ALL JOBS
========================================================= */

export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await JobsModel.getAllJobs();

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

/* =========================================================
   GET ACTIVE JOBS
========================================================= */

export const getActiveJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await JobsModel.getActiveJobs();

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
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

  res.status(200).json({
    success: true,
    data: job
  });
});

/* =========================================================
   GET JOBS BY STATUS
========================================================= */

export const getJobsByStatus = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.params;

  const jobs = await JobsModel.getJobsByStatus(status);

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

/* =========================================================
   GET JOBS BY TYPE
========================================================= */

export const getJobsByType = catchAsyncErrors(async (req, res, next) => {
  const { type } = req.params;

  const jobs = await JobsModel.getJobsByType(type);

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

/* =========================================================
   GET JOBS BY CITY
========================================================= */

export const getJobsByCity = catchAsyncErrors(async (req, res, next) => {
  const { city } = req.params;

  const jobs = await JobsModel.getJobsByCity(city);

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

/* =========================================================
   UPDATE JOB
========================================================= */

export const updateJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const {
    full_name, title, description, sub_title, sub_description,
    about_team, about_company, job_title, city_name, responsibilities,
    type, link, facilities, social, seo_title, seo_description,
    seo_keyword, status, slug
  } = req.body;

  // Check if job exists
  const existingJob = await JobsModel.getJobById(id);
  if (!existingJob) {
    return next(new ErrorHandler('Job not found', 404));
  }

  // Check slug uniqueness if slug is being updated
  if (slug && slug !== existingJob.slug) {
    const slugExists = await JobsModel.checkSlugExists(slug, id);
    if (slugExists) {
      return next(new ErrorHandler('Slug already exists', 400));
    }
  }

  const jobData = {
    full_name: full_name ?? existingJob.full_name,
    title: title ?? existingJob.title,
    description: description ?? existingJob.description,
    sub_title: sub_title ?? existingJob.sub_title,
    sub_description: sub_description ?? existingJob.sub_description,
    about_team: about_team ?? existingJob.about_team,
    about_company: about_company ?? existingJob.about_company,
    job_title: job_title ?? existingJob.job_title,
    city_name: city_name ?? existingJob.city_name,
    responsibilities: responsibilities ?? existingJob.responsibilities,
    type: type ?? existingJob.type,
    link: link ?? existingJob.link,
    facilities: facilities ?? existingJob.facilities,
    social: social ?? existingJob.social,
    seo_title: seo_title ?? existingJob.seo_title,
    seo_description: seo_description ?? existingJob.seo_description,
    seo_keyword: seo_keyword ?? existingJob.seo_keyword,
    status: status ?? existingJob.status,
    slug: slug ?? existingJob.slug
  };

  await JobsModel.updateJob(id, jobData);

  res.status(200).json({
    success: true,
    message: 'Job updated successfully',
    data: { id: parseInt(id), ...jobData }
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

  const existingJob = await JobsModel.getJobById(id);
  if (!existingJob) {
    return next(new ErrorHandler('Job not found', 404));
  }

  await JobsModel.updateJobStatus(id, status);

  res.status(200).json({
    success: true,
    message: 'Job status updated successfully'
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
    message: `Job status changed to ${newStatus}`,
    data: { status: newStatus }
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
    message: 'Job deleted successfully'
  });
});

/* =========================================================
   SEARCH JOBS
========================================================= */

export const searchJobs = catchAsyncErrors(async (req, res, next) => {
  const { q, query, search } = req.query;
  const searchTerm = q || query || search;

  if (!searchTerm) {
    return next(new ErrorHandler('Search term is required', 400));
  }

  const jobs = await JobsModel.searchJobs(searchTerm);

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

/* =========================================================
   SEARCH ACTIVE JOBS
========================================================= */

export const searchActiveJobs = catchAsyncErrors(async (req, res, next) => {
  const { q, query, search } = req.query;
  const searchTerm = q || query || search;

  if (!searchTerm) {
    return next(new ErrorHandler('Search term is required', 400));
  }

  const jobs = await JobsModel.searchActiveJobs(searchTerm);

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
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
   GET JOBS WITH PAGINATION
========================================================= */

export const getJobsWithPagination = catchAsyncErrors(async (req, res, next) => {
  const { page, limit, status } = req.query;

  const result = await JobsModel.getJobsWithPagination(
    page || 1,
    limit || 10,
    status || null
  );

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
   GET JOBS COUNT BY TYPE
========================================================= */

export const getJobsCountByType = catchAsyncErrors(async (req, res, next) => {
  const data = await JobsModel.getJobsCountByType();

  res.status(200).json({
    success: true,
    data
  });
});

/* =========================================================
   GET JOBS COUNT BY CITY
========================================================= */

export const getJobsCountByCity = catchAsyncErrors(async (req, res, next) => {
  const data = await JobsModel.getJobsCountByCity();

  res.status(200).json({
    success: true,
    data
  });
});

/* =========================================================
   GET ALL CITIES
========================================================= */

export const getAllCities = catchAsyncErrors(async (req, res, next) => {
  const cities = await JobsModel.getAllCities();

  res.status(200).json({
    success: true,
    data: cities.map(c => c.city_name)
  });
});

/* =========================================================
   GET ALL JOB TYPES
========================================================= */

export const getAllJobTypes = catchAsyncErrors(async (req, res, next) => {
  const types = await JobsModel.getAllJobTypes();

  res.status(200).json({
    success: true,
    data: types.map(t => t.type)
  });
});

/* =========================================================
   FILTER JOBS
========================================================= */

export const filterJobs = catchAsyncErrors(async (req, res, next) => {
  const { type, city_name, status, search } = req.query;

  const filters = {
    type: type || null,
    city_name: city_name || null,
    status: status || null,
    search: search || null
  };

  const jobs = await JobsModel.filterJobs(filters);

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
  });
});

/* =========================================================
   GET JOBS BY DATE RANGE
========================================================= */

export const getJobsByDateRange = catchAsyncErrors(async (req, res, next) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return next(new ErrorHandler('Start date and end date are required', 400));
  }

  const jobs = await JobsModel.getJobsByDateRange(start_date, end_date);

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs
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
    message: `${result.affectedRows} jobs updated successfully`
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
    message: `${result.affectedRows} jobs deleted successfully`
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
   CLEAR ALL JOBS
========================================================= */

export const clearAllJobs = catchAsyncErrors(async (req, res, next) => {
  await JobsModel.clearAllJobs();

  res.status(200).json({
    success: true,
    message: 'All jobs cleared successfully'
  });
});