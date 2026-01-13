import * as BuildingStyleModel from '../../models/properties/building_style.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

/* =========================================================
   CREATE STYLE
========================================================= */
export const createStyle = catchAsyncErrors(async (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return next(new ErrorHandler("Name is required", 400));
  }

  // Check for duplicates
  const existing = await BuildingStyleModel.getBuildingStyleByName(name);
  if (existing) {
    return next(new ErrorHandler("Building style already exists", 409));
  }

  const result = await BuildingStyleModel.createBuildingStyle(req.body);

  res.status(201).json({
    success: true,
    message: "Building style created successfully",
    data: {
      id: result.insertId,
      name
    }
  });
});

/* =========================================================
   GET ALL STYLES
========================================================= */
export const getAllStyles = catchAsyncErrors(async (req, res, next) => {
  const styles = await BuildingStyleModel.getAllBuildingStyles();

  res.status(200).json({
    success: true,
    count: styles.length,
    styles
  });
});

/* =========================================================
   GET STYLE BY ID
========================================================= */
export const getStyleById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const style = await BuildingStyleModel.getBuildingStyleById(id);

  if (!style) {
    return next(new ErrorHandler(`Building style not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    style
  });
});

/* =========================================================
   UPDATE STYLE
========================================================= */
export const updateStyle = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  const existingStyle = await BuildingStyleModel.getBuildingStyleById(id);
  if (!existingStyle) {
    return next(new ErrorHandler(`Building style not found with id: ${id}`, 404));
  }

  // Check duplication if name is changing
  if (name && name !== existingStyle.name) {
    const duplicate = await BuildingStyleModel.getBuildingStyleByName(name);
    if (duplicate) {
      return next(new ErrorHandler("Building style name already exists", 409));
    }
  }

  const updateData = {
    name: name || existingStyle.name
  };

  await BuildingStyleModel.updateBuildingStyle(id, updateData);

  res.status(200).json({
    success: true,
    message: "Building style updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE STYLE
========================================================= */
export const deleteStyle = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingStyle = await BuildingStyleModel.getBuildingStyleById(id);
  if (!existingStyle) {
    return next(new ErrorHandler(`Building style not found with id: ${id}`, 404));
  }

  await BuildingStyleModel.deleteBuildingStyle(id);

  res.status(200).json({
    success: true,
    message: "Building style deleted successfully"
  });
});