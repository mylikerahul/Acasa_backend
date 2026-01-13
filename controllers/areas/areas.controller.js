import path from 'path';
import fs from 'fs/promises';
import * as AreaModel from "../../models/areas/areas.model.js";
import catchAsyncErrors from "../../middleware/catchAsyncErrors.js";
import ErrorHandler from "../../utils/errorHandler.js";

/* =========================================================
   CREATE AREA
========================================================= */
export const createArea = catchAsyncErrors(async (req, res, next) => {
  const { name, slug } = req.body;

  if (!name || !slug) {
    return next(new ErrorHandler("Name and Slug are required", 400));
  }

  // Check unique slug
  const existing = await AreaModel.getAreaBySlug(slug);
  if (existing) {
    return next(new ErrorHandler("Slug already exists", 409));
  }

  // Handle Image Upload (Upload field)
  const uploadPath = req.file ? req.file.path : null;

  const areaData = {
    ...req.body,
    Upload: uploadPath,
    Created: req.body.Created || (req.user ? req.user.name : 'Admin') // Default creator
  };

  const result = await AreaModel.createArea(areaData);

  res.status(201).json({
    success: true,
    message: "Area created successfully",
    data: {
      id: result.insertId,
      ...areaData
    }
  });
});

/* =========================================================
   GET ALL AREAS
========================================================= */
export const getAllAreas = catchAsyncErrors(async (req, res, next) => {
  const areas = await AreaModel.getAllAreas();

  res.status(200).json({
    success: true,
    count: areas.length,
    areas
  });
});

/* =========================================================
   GET AREA BY ID
========================================================= */
export const getAreaById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const area = await AreaModel.getAreaById(id);

  if (!area) {
    return next(new ErrorHandler(`Area not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    area
  });
});

/* =========================================================
   GET AREA BY SLUG (Public/SEO)
========================================================= */
export const getAreaBySlug = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;
  const area = await AreaModel.getAreaBySlug(slug);

  if (!area) {
    return next(new ErrorHandler(`Area not found with slug: ${slug}`, 404));
  }

  res.status(200).json({
    success: true,
    area
  });
});

/* =========================================================
   UPDATE AREA
========================================================= */
export const updateArea = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingArea = await AreaModel.getAreaById(id);
  if (!existingArea) {
    return next(new ErrorHandler(`Area not found with id: ${id}`, 404));
  }

  let uploadPath = existingArea.Upload;

  // Handle File Replacement
  if (req.file) {
    if (existingArea.Upload) {
      try {
        await fs.unlink(existingArea.Upload);
      } catch (error) {
        console.error("Error deleting old area image:", error);
      }
    }
    uploadPath = req.file.path;
  }

  const updateData = {
    name: req.body.name || existingArea.name,
    city: req.body.city || existingArea.city,
    developer: req.body.developer || existingArea.developer,
    Created: req.body.Created || existingArea.Created,
    title: req.body.title || existingArea.title,
    slug: req.body.slug || existingArea.slug,
    sub_title: req.body.sub_title || existingArea.sub_title,
    descriptions: req.body.descriptions || existingArea.descriptions,
    seo_title: req.body.seo_title || existingArea.seo_title,
    seo_keywork: req.body.seo_keywork || existingArea.seo_keywork,
    seo_description: req.body.seo_description || existingArea.seo_description,
    Upload: uploadPath
  };

  await AreaModel.updateArea(id, updateData);

  res.status(200).json({
    success: true,
    message: "Area updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE AREA
========================================================= */
export const deleteArea = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingArea = await AreaModel.getAreaById(id);
  if (!existingArea) {
    return next(new ErrorHandler(`Area not found with id: ${id}`, 404));
  }

  // Delete associated image
  if (existingArea.Upload) {
    try {
      await fs.unlink(existingArea.Upload);
    } catch (error) {
      console.error("Error deleting area image:", error);
    }
  }

  await AreaModel.deleteArea(id);

  res.status(200).json({
    success: true,
    message: "Area deleted successfully"
  });
});