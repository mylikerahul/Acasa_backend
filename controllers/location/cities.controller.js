import path from 'path';
import fs from 'fs/promises';
import * as CityModel from '../../models/location/cities.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== CONSTANTS ====================
const UPLOAD_FOLDER = 'cities';
const VALID_STATUSES = [0, 1];

/* =========================================================
   CREATE CITY
========================================================= */
export const createCity = catchAsyncErrors(async (req, res, next) => {
  const { name, slug } = req.body;

  if (!name || !slug) {
    return next(new ErrorHandler("City name and Slug are required", 400));
  }

  // Check unique slug
  const existing = await CityModel.getCityBySlug(slug);
  if (existing) {
    return next(new ErrorHandler("Slug already exists", 409));
  }

  // Handle Image Upload
  const img = req.file ? req.file.path : null;

  const cityData = {
    ...req.body,
    img,
    status: req.body.status !== undefined ? parseInt(req.body.status) : 1
  };

  const result = await CityModel.createCity(cityData);

  res.status(201).json({
    success: true,
    message: "City created successfully",
    data: { id: result.insertId, ...cityData }
  });
});

/* =========================================================
   GET ALL CITIES
========================================================= */
export const getAllCities = catchAsyncErrors(async (req, res, next) => {
  const cities = await CityModel.getAllCities();
  res.status(200).json({ success: true, count: cities.length, cities });
});

/* =========================================================
   GET CITY BY ID
========================================================= */
export const getCityById = catchAsyncErrors(async (req, res, next) => {
  const city = await CityModel.getCityById(req.params.id);
  if (!city) return next(new ErrorHandler("City not found", 404));
  res.status(200).json({ success: true, city });
});

/* =========================================================
   GET CITY BY SLUG
========================================================= */
export const getCityBySlug = catchAsyncErrors(async (req, res, next) => {
  const city = await CityModel.getCityBySlug(req.params.slug);
  if (!city) return next(new ErrorHandler("City not found", 404));
  res.status(200).json({ success: true, city });
});

/* =========================================================
   UPDATE CITY
========================================================= */
export const updateCity = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const existingCity = await CityModel.getCityById(id);
  if (!existingCity) return next(new ErrorHandler("City not found", 404));

  let img = existingCity.img;

  if (req.file) {
    if (existingCity.img) {
      try { await fs.unlink(existingCity.img); } catch (e) {}
    }
    img = req.file.path;
  }

  const updateData = {
    country_id: req.body.country_id || existingCity.country_id,
    state_id: req.body.state_id || existingCity.state_id,
    city_data_id: req.body.city_data_id || existingCity.city_data_id,
    name: req.body.name || existingCity.name,
    slug: req.body.slug || existingCity.slug,
    latitude: req.body.latitude || existingCity.latitude,
    longitude: req.body.longitude || existingCity.longitude,
    description: req.body.description || existingCity.description,
    seo_title: req.body.seo_title || existingCity.seo_title,
    seo_keywork: req.body.seo_keywork || existingCity.seo_keywork,
    seo_description: req.body.seo_description || existingCity.seo_description,
    status: req.body.status !== undefined ? parseInt(req.body.status) : existingCity.status,
    img
  };

  await CityModel.updateCity(id, updateData);
  res.status(200).json({ success: true, message: "City updated successfully", data: updateData });
});

/* =========================================================
   DELETE CITY
========================================================= */
export const deleteCity = catchAsyncErrors(async (req, res, next) => {
  const city = await CityModel.getCityById(req.params.id);
  if (!city) return next(new ErrorHandler("City not found", 404));

  if (city.img) {
    try { await fs.unlink(city.img); } catch (e) {}
  }

  await CityModel.deleteCity(req.params.id);
  res.status(200).json({ success: true, message: "City deleted successfully" });
});