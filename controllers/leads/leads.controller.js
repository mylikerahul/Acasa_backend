import path from 'path';
import fs from 'fs/promises';
import * as LeadModel from '../../models/leads/leads.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

/* =========================================================
   CREATE LEAD
========================================================= */
export const createLead = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return next(new ErrorHandler("Name, Email, and Phone are required", 400));
  }

  // Handle Attachment Upload
  const attachment = req.file ? req.file.path : null;

  // Capture IP Address
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

  const leadData = {
    ...req.body,
    attachment,
    ip
  };

  const result = await LeadModel.createLead(leadData);

  res.status(201).json({
    success: true,
    message: "Lead submitted successfully",
    data: {
      id: result.insertId,
      ...leadData
    }
  });
});

/* =========================================================
   GET ALL LEADS (Admin)
========================================================= */
export const getAllLeads = catchAsyncErrors(async (req, res, next) => {
  const leads = await LeadModel.getAllLeads();

  res.status(200).json({
    success: true,
    count: leads.length,
    leads
  });
});

/* =========================================================
   GET MY LEADS (Agent)
========================================================= */
export const getMyLeads = catchAsyncErrors(async (req, res, next) => {
  const leads = await LeadModel.getLeadsByAgentId(req.user.id);

  res.status(200).json({
    success: true,
    count: leads.length,
    leads
  });
});

/* =========================================================
   GET LEAD BY ID
========================================================= */
export const getLeadById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const lead = await LeadModel.getLeadById(id);

  if (!lead) {
    return next(new ErrorHandler(`Lead not found with id: ${id}`, 404));
  }

  // Auth Check: Only Admin or the assigned Agent can view
  if (req.user.role !== 'admin' && lead.agent_id !== req.user.id) {
    return next(new ErrorHandler("Not authorized to view this lead", 403));
  }

  res.status(200).json({
    success: true,
    lead
  });
});

/* =========================================================
   UPDATE LEAD
========================================================= */
export const updateLead = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingLead = await LeadModel.getLeadById(id);
  if (!existingLead) {
    return next(new ErrorHandler(`Lead not found with id: ${id}`, 404));
  }

  let attachment = existingLead.attachment;

  // Handle File Replacement
  if (req.file) {
    if (existingLead.attachment) {
      try {
        await fs.unlink(existingLead.attachment);
      } catch (error) {
        console.error("Error deleting old attachment:", error);
      }
    }
    attachment = req.file.path;
  }

  const updateData = {
    property_id: req.body.property_id || existingLead.property_id,
    agent_id: req.body.agent_id || existingLead.agent_id,
    slug: req.body.slug || existingLead.slug,
    title: req.body.title || existingLead.title,
    name: req.body.name || existingLead.name,
    email: req.body.email || existingLead.email,
    phone: req.body.phone || existingLead.phone,
    message: req.body.message || existingLead.message,
    status: req.body.status || existingLead.status,
    heading: req.body.heading || existingLead.heading,
    descriptions: req.body.descriptions || existingLead.descriptions,
    sub_title: req.body.sub_title || existingLead.sub_title,
    seo_title: req.body.seo_title || existingLead.seo_title,
    seo_keywork: req.body.seo_keywork || existingLead.seo_keywork,
    seo_description: req.body.seo_description || existingLead.seo_description,
    attachment: attachment
  };

  await LeadModel.updateLead(id, updateData);

  res.status(200).json({
    success: true,
    message: "Lead updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE LEAD
========================================================= */
export const deleteLead = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingLead = await LeadModel.getLeadById(id);
  if (!existingLead) {
    return next(new ErrorHandler(`Lead not found with id: ${id}`, 404));
  }

  // Delete attachment
  if (existingLead.attachment) {
    try {
      await fs.unlink(existingLead.attachment);
    } catch (error) {
      console.error("Error deleting attachment file:", error);
    }
  }

  await LeadModel.deleteLead(id);

  res.status(200).json({
    success: true,
    message: "Lead deleted successfully"
  });
});