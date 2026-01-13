import * as AmenityModel from '../../models/properties/commercial_amenities.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

/* =========================================================
   CREATE AMENITY
========================================================= */
export const createAmenity = catchAsyncErrors(async (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return next(new ErrorHandler("Name is required", 400));
  }

  // Check for duplicates
  const existing = await AmenityModel.getAmenityByName(name);
  if (existing) {
    return next(new ErrorHandler("Commercial amenity already exists", 409));
  }

  const result = await AmenityModel.createAmenity(req.body);

  res.status(201).json({
    success: true,
    message: "Commercial amenity created successfully",
    data: {
      id: result.insertId,
      name
    }
  });
});

/* =========================================================
   GET ALL AMENITIES
========================================================= */
export const getAllAmenities = catchAsyncErrors(async (req, res, next) => {
  const amenities = await AmenityModel.getAllAmenities();

  res.status(200).json({
    success: true,
    count: amenities.length,
    amenities
  });
});

/* =========================================================
   GET AMENITY BY ID
========================================================= */
export const getAmenityById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const amenity = await AmenityModel.getAmenityById(id);

  if (!amenity) {
    return next(new ErrorHandler(`Commercial amenity not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    amenity
  });
});

/* =========================================================
   UPDATE AMENITY
========================================================= */
export const updateAmenity = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  const existingAmenity = await AmenityModel.getAmenityById(id);
  if (!existingAmenity) {
    return next(new ErrorHandler(`Commercial amenity not found with id: ${id}`, 404));
  }

  if (name && name !== existingAmenity.name) {
    const duplicate = await AmenityModel.getAmenityByName(name);
    if (duplicate) {
      return next(new ErrorHandler("Commercial amenity name already exists", 409));
    }
  }

  const updateData = {
    name: name || existingAmenity.name
  };

  await AmenityModel.updateAmenity(id, updateData);

  res.status(200).json({
    success: true,
    message: "Commercial amenity updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE AMENITY
========================================================= */
export const deleteAmenity = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingAmenity = await AmenityModel.getAmenityById(id);
  if (!existingAmenity) {
    return next(new ErrorHandler(`Commercial amenity not found with id: ${id}`, 404));
  }

  await AmenityModel.deleteAmenity(id);

  res.status(200).json({
    success: true,
    message: "Commercial amenity deleted successfully"
  });
});