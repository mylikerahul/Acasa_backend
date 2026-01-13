import path from 'path';
import fs from 'fs/promises';
import * as SubmenuModel from "../../models/admin/admin_submenu.model.js";
import catchAsyncErrors from "../../middleware/catchAsyncErrors.js";
import ErrorHandler from "../../utils/errorHandler.js";

/* =========================================================
   CREATE SUBMENU
========================================================= */
export const createSubmenu = catchAsyncErrors(async (req, res, next) => {
  const { label, parent } = req.body;

  if (!label || !parent) {
    return next(new ErrorHandler("Label and Parent ID are required", 400));
  }

  // Handle Thumbnail Upload
  const thumbnail = req.file ? req.file.path : null;

  const submenuData = {
    ...req.body,
    thumbnail
  };

  const result = await SubmenuModel.createSubmenu(submenuData);

  res.status(201).json({
    success: true,
    message: "Submenu item created successfully",
    data: {
      id: result.insertId,
      ...submenuData
    }
  });
});

/* =========================================================
   GET ALL SUBMENUS
========================================================= */
export const getAllSubmenus = catchAsyncErrors(async (req, res, next) => {
  const submenus = await SubmenuModel.getAllSubmenus();

  res.status(200).json({
    success: true,
    count: submenus.length,
    submenus
  });
});

/* =========================================================
   GET SUBMENUS BY PARENT
========================================================= */
export const getSubmenusByParent = catchAsyncErrors(async (req, res, next) => {
  const { parentId } = req.params;
  const submenus = await SubmenuModel.getSubmenusByParentId(parentId);

  res.status(200).json({
    success: true,
    count: submenus.length,
    submenus
  });
});

/* =========================================================
   GET SUBMENU BY ID
========================================================= */
export const getSubmenuById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const submenu = await SubmenuModel.getSubmenuById(id);

  if (!submenu) {
    return next(new ErrorHandler(`Submenu not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    submenu
  });
});

/* =========================================================
   UPDATE SUBMENU
========================================================= */
export const updateSubmenu = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingSubmenu = await SubmenuModel.getSubmenuById(id);
  if (!existingSubmenu) {
    return next(new ErrorHandler(`Submenu not found with id: ${id}`, 404));
  }

  let thumbnail = existingSubmenu.thumbnail;

  // Handle File Replacement
  if (req.file) {
    if (existingSubmenu.thumbnail) {
      try {
        await fs.unlink(existingSubmenu.thumbnail);
      } catch (error) {
        console.error("Error deleting old thumbnail:", error);
      }
    }
    thumbnail = req.file.path;
  }

  const updateData = {
    item_type: req.body.item_type || existingSubmenu.item_type,
    label: req.body.label || existingSubmenu.label,
    item_link: req.body.item_link || existingSubmenu.item_link,
    parent: req.body.parent || existingSubmenu.parent,
    col_num: req.body.col_num !== undefined ? req.body.col_num : existingSubmenu.col_num,
    item_order: req.body.item_order !== undefined ? req.body.item_order : existingSubmenu.item_order,
    status: req.body.status || existingSubmenu.status,
    thumbnail: thumbnail
  };

  await SubmenuModel.updateSubmenu(id, updateData);

  res.status(200).json({
    success: true,
    message: "Submenu updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE SUBMENU
========================================================= */
export const deleteSubmenu = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingSubmenu = await SubmenuModel.getSubmenuById(id);
  if (!existingSubmenu) {
    return next(new ErrorHandler(`Submenu not found with id: ${id}`, 404));
  }

  // Delete associated image
  if (existingSubmenu.thumbnail) {
    try {
      await fs.unlink(existingSubmenu.thumbnail);
    } catch (error) {
      console.error("Error deleting thumbnail file:", error);
    }
  }

  await SubmenuModel.deleteSubmenu(id);

  res.status(200).json({
    success: true,
    message: "Submenu deleted successfully"
  });
});