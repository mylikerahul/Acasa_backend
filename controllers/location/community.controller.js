import path from 'path';
import fs from 'fs/promises';
import * as CommunityModel from '../../models/location/community.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// Helper to extract file path if it exists
const getFilePath = (files, fieldName) => {
  if (files && files[fieldName] && files[fieldName][0]) {
    return files[fieldName][0].path;
  }
  return null;
};

/* =========================================================
   CREATE COMMUNITY
========================================================= */
export const createCommunity = catchAsyncErrors(async (req, res, next) => {
  const { name, slug } = req.body;

  if (!name || !slug) {
    return next(new ErrorHandler("Name and Slug are required", 400));
  }

  const existing = await CommunityModel.getCommunityBySlug(slug);
  if (existing) {
    return next(new ErrorHandler("Slug already exists", 409));
  }

  // Handle Multiple Images
  const communityData = {
    ...req.body,
    img: getFilePath(req.files, 'img'),
    school_img: getFilePath(req.files, 'school_img'),
    hotel_img: getFilePath(req.files, 'hotel_img'),
    hospital_img: getFilePath(req.files, 'hospital_img'),
    train_img: getFilePath(req.files, 'train_img'),
    bus_img: getFilePath(req.files, 'bus_img'),
    status: req.body.status !== undefined ? parseInt(req.body.status) : 1,
    featured: req.body.featured !== undefined ? parseInt(req.body.featured) : 0
  };

  const result = await CommunityModel.createCommunity(communityData);

  res.status(201).json({
    success: true,
    message: "Community created successfully",
    data: { id: result.insertId, ...communityData }
  });
});

/* =========================================================
   GET ALL
========================================================= */
export const getAllCommunities = catchAsyncErrors(async (req, res, next) => {
  const communities = await CommunityModel.getAllCommunities();
  res.status(200).json({ success: true, count: communities.length, communities });
});

/* =========================================================
   GET BY ID
========================================================= */
export const getCommunityById = catchAsyncErrors(async (req, res, next) => {
  const community = await CommunityModel.getCommunityById(req.params.id);
  if (!community) return next(new ErrorHandler("Community not found", 404));
  res.status(200).json({ success: true, community });
});

/* =========================================================
   GET BY SLUG
========================================================= */
export const getCommunityBySlug = catchAsyncErrors(async (req, res, next) => {
  const community = await CommunityModel.getCommunityBySlug(req.params.slug);
  if (!community) return next(new ErrorHandler("Community not found", 404));
  res.status(200).json({ success: true, community });
});

/* =========================================================
   UPDATE COMMUNITY
========================================================= */
export const updateCommunity = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const existing = await CommunityModel.getCommunityById(id);
  if (!existing) return next(new ErrorHandler("Community not found", 404));

  // Helper to handle file replacement
  const handleFileUpdate = async (fieldName) => {
    const newFile = getFilePath(req.files, fieldName);
    if (newFile) {
      if (existing[fieldName]) {
        try { await fs.unlink(existing[fieldName]); } catch (e) { console.error(`Failed to delete old ${fieldName}`); }
      }
      return newFile;
    }
    return existing[fieldName];
  };

  const updateData = {
    ...req.body,
    community_id: req.body.community_id || existing.community_id,
    name: req.body.name || existing.name,
    country_id: req.body.country_id || existing.country_id,
    state_id: req.body.state_id || existing.state_id,
    city_id: req.body.city_id || existing.city_id,
    slug: req.body.slug || existing.slug,
    // ... map other text fields as needed, or rely on ...req.body overriding
    
    // Handle Images
    img: await handleFileUpdate('img'),
    school_img: await handleFileUpdate('school_img'),
    hotel_img: await handleFileUpdate('hotel_img'),
    hospital_img: await handleFileUpdate('hospital_img'),
    train_img: await handleFileUpdate('train_img'),
    bus_img: await handleFileUpdate('bus_img'),

    status: req.body.status !== undefined ? parseInt(req.body.status) : existing.status,
    featured: req.body.featured !== undefined ? parseInt(req.body.featured) : existing.featured
  };

  await CommunityModel.updateCommunity(id, updateData);
  res.status(200).json({ success: true, message: "Community updated successfully", data: updateData });
});

/* =========================================================
   DELETE COMMUNITY
========================================================= */
export const deleteCommunity = catchAsyncErrors(async (req, res, next) => {
  const existing = await CommunityModel.getCommunityById(req.params.id);
  if (!existing) return next(new ErrorHandler("Community not found", 404));

  // Delete all associated images
  const imageFields = ['img', 'school_img', 'hotel_img', 'hospital_img', 'train_img', 'bus_img'];
  for (const field of imageFields) {
    if (existing[field]) {
      try { await fs.unlink(existing[field]); } catch (e) {}
    }
  }

  await CommunityModel.deleteCommunity(req.params.id);
  res.status(200).json({ success: true, message: "Community deleted successfully" });
});