import path from 'path';
import fs from 'fs/promises';
import * as MenuItemModel from "../../models/admin/admin_menu_items.model.js";
import catchAsyncErrors from "../../middleware/catchAsyncErrors.js";
import ErrorHandler from "../../utils/errorHandler.js";

/* =========================================================
   CREATE MENU ITEM
========================================================= */
export const createMenuItem = catchAsyncErrors(async (req, res, next) => {
  const { label, menu } = req.body;

  if (!label || !menu) {
    return next(new ErrorHandler("Label and Parent Menu ID are required", 400));
  }

  // Handle Image Upload if present
  const image_icon = req.file ? req.file.path : req.body.image_icon;

  const itemData = {
    ...req.body,
    class_name: req.body.class, // Map 'class' from body to 'class_name' for model
    image_icon
  };

  const result = await MenuItemModel.createAdminMenuItem(itemData);

  res.status(201).json({
    success: true,
    message: "Menu item created successfully",
    data: {
      id: result.insertId,
      ...itemData
    }
  });
});

/* =========================================================
   GET ALL MENU ITEMS
========================================================= */
export const getAllMenuItems = catchAsyncErrors(async (req, res, next) => {
  const items = await MenuItemModel.getAllAdminMenuItems();

  res.status(200).json({
    success: true,
    count: items.length,
    items
  });
});

/* =========================================================
   GET ITEMS BY PARENT MENU
========================================================= */
export const getItemsByMenu = catchAsyncErrors(async (req, res, next) => {
  const { menuId } = req.params;
  const items = await MenuItemModel.getItemsByMenuId(menuId);

  res.status(200).json({
    success: true,
    count: items.length,
    items
  });
});

/* =========================================================
   GET MENU ITEM BY ID
========================================================= */
export const getMenuItemById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const item = await MenuItemModel.getAdminMenuItemById(id);

  if (!item) {
    return next(new ErrorHandler(`Menu item not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    item
  });
});

/* =========================================================
   UPDATE MENU ITEM
========================================================= */
export const updateMenuItem = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingItem = await MenuItemModel.getAdminMenuItemById(id);
  if (!existingItem) {
    return next(new ErrorHandler(`Menu item not found with id: ${id}`, 404));
  }

  let image_icon = existingItem.image_icon;

  // Handle File Replacement
  if (req.file) {
    if (existingItem.image_icon) {
      try {
        await fs.unlink(existingItem.image_icon);
      } catch (error) {
        console.error("Error deleting old image:", error);
      }
    }
    image_icon = req.file.path;
  }

  const updateData = {
    label: req.body.label || existingItem.label,
    link: req.body.link || existingItem.link,
    parent: req.body.parent !== undefined ? req.body.parent : existingItem.parent,
    sort: req.body.sort !== undefined ? req.body.sort : existingItem.sort,
    class_name: req.body.class || existingItem.class,
    menu: req.body.menu || existingItem.menu,
    depth: req.body.depth !== undefined ? req.body.depth : existingItem.depth,
    property_type: req.body.property_type || existingItem.property_type,
    property_zone: req.body.property_zone || existingItem.property_zone,
    price: req.body.price || existingItem.price,
    title: req.body.title || existingItem.title,
    bedrooms: req.body.bedrooms || existingItem.bedrooms,
    block: req.body.block || existingItem.block,
    location: req.body.location || existingItem.location,
    status: req.body.status || existingItem.status,
    image_icon: image_icon
  };

  await MenuItemModel.updateAdminMenuItem(id, updateData);

  res.status(200).json({
    success: true,
    message: "Menu item updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE MENU ITEM
========================================================= */
export const deleteMenuItem = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingItem = await MenuItemModel.getAdminMenuItemById(id);
  if (!existingItem) {
    return next(new ErrorHandler(`Menu item not found with id: ${id}`, 404));
  }

  // Delete associated image if exists
  if (existingItem.image_icon) {
    try {
      await fs.unlink(existingItem.image_icon);
    } catch (error) {
      console.error("Error deleting image file:", error);
    }
  }

  await MenuItemModel.deleteAdminMenuItem(id);

  res.status(200).json({
    success: true,
    message: "Menu item deleted successfully"
  });
});