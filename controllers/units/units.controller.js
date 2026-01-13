import * as UnitModel from "../../models/units/units.model.js";
import catchAsyncErrors from "../../middleware/catchAsyncErrors.js";
import ErrorHandler from "../../utils/errorHandler.js";

/* =========================================================
   CREATE UNIT
========================================================= */
export const createUnit = catchAsyncErrors(async (req, res, next) => {
  const { module_id, module_type, title, price } = req.body;

  if (!module_id || !module_type) {
    return next(new ErrorHandler("Module ID and Module Type are required", 400));
  }
  
  if (!title || !price) {
    return next(new ErrorHandler("Title and Price are required", 400));
  }

  const result = await UnitModel.createUnit(req.body);

  res.status(201).json({
    success: true,
    message: "Unit created successfully",
    data: {
      id: result.insertId,
      ...req.body
    }
  });
});

/* =========================================================
   GET ALL UNITS
========================================================= */
export const getAllUnits = catchAsyncErrors(async (req, res, next) => {
  const units = await UnitModel.getAllUnits();

  res.status(200).json({
    success: true,
    count: units.length,
    units
  });
});

/* =========================================================
   GET UNIT BY ID
========================================================= */
export const getUnitById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const unit = await UnitModel.getUnitById(id);

  if (!unit) {
    return next(new ErrorHandler(`Unit not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    unit
  });
});

/* =========================================================
   GET UNITS BY MODULE (e.g. project/property)
========================================================= */
export const getUnitsByModule = catchAsyncErrors(async (req, res, next) => {
  const { moduleType, moduleId } = req.params;
  
  const units = await UnitModel.getUnitsByModule(moduleId, moduleType);

  res.status(200).json({
    success: true,
    count: units.length,
    units
  });
});

/* =========================================================
   UPDATE UNIT
========================================================= */
export const updateUnit = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingUnit = await UnitModel.getUnitById(id);
  if (!existingUnit) {
    return next(new ErrorHandler(`Unit not found with id: ${id}`, 404));
  }

  // Merge existing data with new data
  const updateData = {
    module_id: req.body.module_id || existingUnit.module_id,
    module_type: req.body.module_type || existingUnit.module_type,
    listing_ids: req.body.listing_ids || existingUnit.listing_ids,
    title: req.body.title || existingUnit.title,
    price: req.body.price || existingUnit.price,
    bedroom: req.body.bedroom || existingUnit.bedroom,
    size: req.body.size || existingUnit.size,
    type: req.body.type || existingUnit.type,
    status: req.body.status || existingUnit.status
  };

  await UnitModel.updateUnit(id, updateData);

  res.status(200).json({
    success: true,
    message: "Unit updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE UNIT
========================================================= */
export const deleteUnit = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingUnit = await UnitModel.getUnitById(id);
  if (!existingUnit) {
    return next(new ErrorHandler(`Unit not found with id: ${id}`, 404));
  }

  await UnitModel.deleteUnit(id);

  res.status(200).json({
    success: true,
    message: "Unit deleted successfully"
  });
});