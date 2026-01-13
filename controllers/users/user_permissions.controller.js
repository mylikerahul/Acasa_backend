import * as PermissionModel from "../../models/user/user_permissions.model.js";
import catchAsyncErrors from "../../middleware/catchAsyncErrors.js";
import ErrorHandler from "../../utils/errorHandler.js";

/* =========================================================
   CREATE PERMISSION
========================================================= */
export const createPermission = catchAsyncErrors(async (req, res, next) => {
  const { user_type } = req.body;

  if (!user_type) {
    return next(new ErrorHandler("User type is required", 400));
  }

  // Check if permission already exists for this type
  const existing = await PermissionModel.getPermissionByUserType(user_type);
  if (existing) {
    return next(new ErrorHandler(`Permissions for ${user_type} already exist`, 409));
  }

  const result = await PermissionModel.createPermission(req.body);

  res.status(201).json({
    success: true,
    message: "Permissions created successfully",
    data: {
      id: result.insertId,
      ...req.body
    }
  });
});

/* =========================================================
   GET ALL PERMISSIONS
========================================================= */
export const getAllPermissions = catchAsyncErrors(async (req, res, next) => {
  const permissions = await PermissionModel.getAllPermissions();

  res.status(200).json({
    success: true,
    count: permissions.length,
    permissions
  });
});

/* =========================================================
   GET PERMISSION BY ID
========================================================= */
export const getPermissionById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const permission = await PermissionModel.getPermissionById(id);

  if (!permission) {
    return next(new ErrorHandler(`Permission set not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    permission
  });
});

/* =========================================================
   GET PERMISSION BY USER TYPE
========================================================= */
export const getPermissionByUserType = catchAsyncErrors(async (req, res, next) => {
  const { userType } = req.params;
  const permission = await PermissionModel.getPermissionByUserType(userType);

  if (!permission) {
    return next(new ErrorHandler(`No permissions found for user type: ${userType}`, 404));
  }

  res.status(200).json({
    success: true,
    permission
  });
});

/* =========================================================
   UPDATE PERMISSION
========================================================= */
export const updatePermission = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // Check if exists
  const existing = await PermissionModel.getPermissionById(id);
  if (!existing) {
    return next(new ErrorHandler(`Permission set not found with id: ${id}`, 404));
  }

  // Merge existing data with new data (so we don't accidentally set missing fields to null)
  // Logic: if req.body has the key, use it. If not, use existing.
  const updateData = { ...existing, ...req.body };

  await PermissionModel.updatePermission(id, updateData);

  res.status(200).json({
    success: true,
    message: "Permissions updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE PERMISSION
========================================================= */
export const deletePermission = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existing = await PermissionModel.getPermissionById(id);
  if (!existing) {
    return next(new ErrorHandler(`Permission set not found with id: ${id}`, 404));
  }

  await PermissionModel.deletePermission(id);

  res.status(200).json({
    success: true,
    message: "Permissions deleted successfully"
  });
});