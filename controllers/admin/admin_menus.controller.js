import * as AdminMenuModel from "../../models/admin/admin_menus.model.js";
import catchAsyncErrors from "../../middleware/catchAsyncErrors.js";
import ErrorHandler from "../../utils/errorHandler.js";

/* =========================================================
   CREATE MENU
========================================================= */
export const createAdminMenu = catchAsyncErrors(async (req, res, next) => {
  const { name, menu_url } = req.body;

  if (!name || !menu_url) {
    return next(new ErrorHandler("Name and Menu URL are required", 400));
  }

  const result = await AdminMenuModel.createAdminMenu(req.body);

  res.status(201).json({
    success: true,
    message: "Admin menu created successfully",
    data: {
      id: result.insertId,
      ...req.body
    }
  });
});

/* =========================================================
   GET ALL MENUS
========================================================= */
export const getAllAdminMenus = catchAsyncErrors(async (req, res, next) => {
  const menus = await AdminMenuModel.getAllAdminMenus();

  res.status(200).json({
    success: true,
    count: menus.length,
    menus
  });
});

/* =========================================================
   GET MENUS BY TYPE
========================================================= */
export const getMenusByType = catchAsyncErrors(async (req, res, next) => {
  const { menuType } = req.params;
  const menus = await AdminMenuModel.getAdminMenusByType(menuType);

  res.status(200).json({
    success: true,
    count: menus.length,
    menus
  });
});

/* =========================================================
   GET MENU BY ID
========================================================= */
export const getAdminMenuById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const menu = await AdminMenuModel.getAdminMenuById(id);

  if (!menu) {
    return next(new ErrorHandler(`Menu not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    menu
  });
});

/* =========================================================
   UPDATE MENU
========================================================= */
export const updateAdminMenu = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingMenu = await AdminMenuModel.getAdminMenuById(id);
  if (!existingMenu) {
    return next(new ErrorHandler(`Menu not found with id: ${id}`, 404));
  }

  // Merge existing data
  const updateData = {
    name: req.body.name || existingMenu.name,
    menu_url: req.body.menu_url || existingMenu.menu_url,
    order_num: req.body.order_num !== undefined ? req.body.order_num : existingMenu.order_num,
    menu_type: req.body.menu_type || existingMenu.menu_type,
    column_num: req.body.column_num !== undefined ? req.body.column_num : existingMenu.column_num,
    status: req.body.status || existingMenu.status,
    for_country: req.body.for_country || existingMenu.for_country
  };

  await AdminMenuModel.updateAdminMenu(id, updateData);

  res.status(200).json({
    success: true,
    message: "Admin menu updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE MENU
========================================================= */
export const deleteAdminMenu = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingMenu = await AdminMenuModel.getAdminMenuById(id);
  if (!existingMenu) {
    return next(new ErrorHandler(`Menu not found with id: ${id}`, 404));
  }

  await AdminMenuModel.deleteAdminMenu(id);

  res.status(200).json({
    success: true,
    message: "Admin menu deleted successfully"
  });
});