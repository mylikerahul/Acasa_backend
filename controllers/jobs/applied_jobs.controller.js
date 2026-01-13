    import path from 'path';
import fs from 'fs/promises';
import * as AppliedJobModel from "../../models/jobs/applied_jobs.model.js";
import catchAsyncErrors from "../../middleware/catchAsyncErrors.js";
import ErrorHandler from "../../utils/errorHandler.js";

/* =========================================================
   SUBMIT APPLICATION
========================================================= */
export const submitApplication = catchAsyncErrors(async (req, res, next) => {
  const { first_name, last_name, email, phone } = req.body;

  if (!first_name || !last_name || !email || !phone) {
    return next(new ErrorHandler("First Name, Last Name, Email, and Phone are required", 400));
  }

  // Handle Resume Upload
  const resume = req.file ? req.file.path : null;

  const applicationData = {
    ...req.body,
    resume
  };

  const result = await AppliedJobModel.createApplication(applicationData);

  res.status(201).json({
    success: true,
    message: "Application submitted successfully",
    data: {
      id: result.insertId,
      ...applicationData
    }
  });
});

/* =========================================================
   GET ALL APPLICATIONS (Admin/HR)
========================================================= */
export const getAllApplications = catchAsyncErrors(async (req, res, next) => {
  const applications = await AppliedJobModel.getAllApplications();

  res.status(200).json({
    success: true,
    count: applications.length,
    applications
  });
});

/* =========================================================
   GET APPLICATION BY ID
========================================================= */
export const getApplicationById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const application = await AppliedJobModel.getApplicationById(id);

  if (!application) {
    return next(new ErrorHandler(`Application not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    application
  });
});

/* =========================================================
   UPDATE APPLICATION (e.g., Update Status)
========================================================= */
export const updateApplication = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingApp = await AppliedJobModel.getApplicationById(id);
  if (!existingApp) {
    return next(new ErrorHandler(`Application not found with id: ${id}`, 404));
  }

  let resume = existingApp.resume;

  // Handle File Replacement if admin updates the resume
  if (req.file) {
    if (existingApp.resume) {
      try {
        await fs.unlink(existingApp.resume);
      } catch (error) {
        console.error("Error deleting old resume:", error);
      }
    }
    resume = req.file.path;
  }

  const updateData = {
    first_name: req.body.first_name || existingApp.first_name,
    last_name: req.body.last_name || existingApp.last_name,
    email: req.body.email || existingApp.email,
    phone: req.body.phone || existingApp.phone,
    message: req.body.message || existingApp.message,
    current_last_employer: req.body.current_last_employer || existingApp.current_last_employer,
    current_job_title: req.body.current_job_title || existingApp.current_job_title,
    employment_status: req.body.employment_status || existingApp.employment_status,
    term: req.body.term !== undefined ? req.body.term : existingApp.term,
    status: req.body.status || existingApp.status,
    resume: resume
  };

  await AppliedJobModel.updateApplication(id, updateData);

  res.status(200).json({
    success: true,
    message: "Application updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE APPLICATION
========================================================= */
export const deleteApplication = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingApp = await AppliedJobModel.getApplicationById(id);
  if (!existingApp) {
    return next(new ErrorHandler(`Application not found with id: ${id}`, 404));
  }

  // Delete resume file
  if (existingApp.resume) {
    try {
      await fs.unlink(existingApp.resume);
    } catch (error) {
      console.error("Error deleting resume file:", error);
    }
  }

  await AppliedJobModel.deleteApplication(id);

  res.status(200).json({
    success: true,
    message: "Application deleted successfully"
  });
});