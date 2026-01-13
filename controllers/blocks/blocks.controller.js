import path from 'path';
import fs from 'fs/promises';
import * as BlocksModel from '../../models/blocks/blocks.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== CONSTANTS ====================
const UPLOAD_FOLDER = 'blocks';
const VALID_STATUSES = [0, 1]; // 0 = inactive, 1 = active

/* =========================================================
   CREATE BLOCK
========================================================= */
export const createBlock = catchAsyncErrors(async (req, res, next) => {
  const { title, slug } = req.body;

  if (!title || !slug) {
    return next(new ErrorHandler("Title and Slug are required", 400));
  }

  // Check if slug exists
  const existing = await BlocksModel.getBlockBySlug(slug);
  if (existing) {
    return next(new ErrorHandler("Slug already exists", 409));
  }

  // Handle Image Upload
  const imageurl = req.file ? req.file.path : null;

  const blockData = {
    ...req.body,
    imageurl,
    status: req.body.status !== undefined ? parseInt(req.body.status) : 1,
    order: req.body.order !== undefined ? parseInt(req.body.order) : 0
  };

  const result = await BlocksModel.createBlock(blockData);

  res.status(201).json({
    success: true,
    message: "Block created successfully",
    data: {
      id: result.insertId,
      ...blockData
    }
  });
});

/* =========================================================
   GET ALL BLOCKS
========================================================= */
export const getAllBlocks = catchAsyncErrors(async (req, res, next) => {
  const blocks = await BlocksModel.getAllBlocks();

  res.status(200).json({
    success: true,
    count: blocks.length,
    blocks
  });
});

/* =========================================================
   GET BLOCK BY ID
========================================================= */
export const getBlockById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const block = await BlocksModel.getBlockById(id);

  if (!block) {
    return next(new ErrorHandler(`Block not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    block
  });
});

/* =========================================================
   UPDATE BLOCK
========================================================= */
export const updateBlock = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingBlock = await BlocksModel.getBlockById(id);
  if (!existingBlock) {
    return next(new ErrorHandler(`Block not found with id: ${id}`, 404));
  }

  let imageurl = existingBlock.imageurl;

  // Handle File Replacement
  if (req.file) {
    // Delete old file if it exists
    if (existingBlock.imageurl) {
      try {
        await fs.unlink(existingBlock.imageurl);
      } catch (error) {
        console.error("Error deleting old block image:", error);
      }
    }
    imageurl = req.file.path;
  }

  const updateData = {
    title: req.body.title || existingBlock.title,
    slug: req.body.slug || existingBlock.slug,
    country: req.body.country || existingBlock.country,
    heading: req.body.heading || existingBlock.heading,
    descriptions: req.body.descriptions || existingBlock.descriptions,
    url: req.body.url || existingBlock.url,
    own_video_url: req.body.own_video_url || existingBlock.own_video_url,
    order: req.body.order !== undefined ? parseInt(req.body.order) : existingBlock.order,
    status: req.body.status !== undefined ? parseInt(req.body.status) : existingBlock.status,
    imageurl: imageurl
  };

  await BlocksModel.updateBlock(id, updateData);

  res.status(200).json({
    success: true,
    message: "Block updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE BLOCK
========================================================= */
export const deleteBlock = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingBlock = await BlocksModel.getBlockById(id);
  if (!existingBlock) {
    return next(new ErrorHandler(`Block not found with id: ${id}`, 404));
  }

  // Delete associated image
  if (existingBlock.imageurl) {
    try {
      await fs.unlink(existingBlock.imageurl);
    } catch (error) {
      console.error("Error deleting block image:", error);
    }
  }

  await BlocksModel.deleteBlock(id);

  res.status(200).json({
    success: true,
    message: "Block deleted successfully"
  });
});