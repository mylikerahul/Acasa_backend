import * as ColumnActionModel from '../../models/settings/column_action.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

/* =========================================================
   CREATE
========================================================= */
export const createColumnAction = catchAsyncErrors(async (req, res, next) => {
  const { module_name, lable } = req.body;

  if (!module_name || !lable) {
    return next(new ErrorHandler("Module Name and Lable are required", 400));
  }

  const result = await ColumnActionModel.createColumnAction(req.body);

  res.status(201).json({
    success: true,
    message: "Column Action created successfully",
    data: {
      id: result.insertId,
      ...req.body
    }
  });
});

/* =========================================================
   GET ALL
========================================================= */
export const getAllColumnActions = catchAsyncErrors(async (req, res, next) => {
  const actions = await ColumnActionModel.getAllColumnActions();

  res.status(200).json({
    success: true,
    count: actions.length,
    actions
  });
});

/* =========================================================
   GET BY MODULE NAME
========================================================= */
export const getActionsByModule = catchAsyncErrors(async (req, res, next) => {
  const { moduleName } = req.params;
  const actions = await ColumnActionModel.getColumnActionsByModule(moduleName);

  res.status(200).json({
    success: true,
    count: actions.length,
    actions
  });
});

/* =========================================================
   GET BY ID
========================================================= */
export const getColumnActionById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const action = await ColumnActionModel.getColumnActionById(id);

  if (!action) {
    return next(new ErrorHandler(`Column Action not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    action
  });
});

/* =========================================================
   UPDATE
========================================================= */
export const updateColumnAction = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingAction = await ColumnActionModel.getColumnActionById(id);
  if (!existingAction) {
    return next(new ErrorHandler(`Column Action not found with id: ${id}`, 404));
  }

  const updateData = {
    module_name: req.body.module_name || existingAction.module_name,
    lable: req.body.lable || existingAction.lable,
    status: req.body.status !== undefined ? req.body.status : existingAction.status
  };

  await ColumnActionModel.updateColumnAction(id, updateData);

  res.status(200).json({
    success: true,
    message: "Column Action updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE
========================================================= */
export const deleteColumnAction = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingAction = await ColumnActionModel.getColumnActionById(id);
  if (!existingAction) {
    return next(new ErrorHandler(`Column Action not found with id: ${id}`, 404));
  }

  await ColumnActionModel.deleteColumnAction(id);

  res.status(200).json({
    success: true,
    message: "Column Action deleted successfully"
  });
});