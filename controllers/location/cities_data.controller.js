import * as CitiesDataModel from '../../models/location/cities_data.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

/* =========================================================
   CREATE
========================================================= */
export const createCityData = catchAsyncErrors(async (req, res, next) => {
  const { name, country_id } = req.body;

  if (!name) {
    return next(new ErrorHandler("Name is required", 400));
  }

  const result = await CitiesDataModel.createCityData(req.body);

  res.status(201).json({
    success: true,
    message: "City Data created successfully",
    data: {
      id: result.insertId,
      ...req.body
    }
  });
});

/* =========================================================
   GET ALL
========================================================= */
export const getAllCitiesData = catchAsyncErrors(async (req, res, next) => {
  const cities = await CitiesDataModel.getAllCitiesData();

  res.status(200).json({
    success: true,
    count: cities.length,
    cities
  });
});

/* =========================================================
   GET BY ID
========================================================= */
export const getCityDataById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const city = await CitiesDataModel.getCityDataById(id);

  if (!city) {
    return next(new ErrorHandler(`City Data not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    city
  });
});

/* =========================================================
   GET BY COUNTRY ID
========================================================= */
export const getCityDataByCountry = catchAsyncErrors(async (req, res, next) => {
  const { countryId } = req.params;
  const cities = await CitiesDataModel.getCityDataByCountryId(countryId);

  res.status(200).json({
    success: true,
    count: cities.length,
    cities
  });
});

/* =========================================================
   UPDATE
========================================================= */
export const updateCityData = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingCity = await CitiesDataModel.getCityDataById(id);
  if (!existingCity) {
    return next(new ErrorHandler(`City Data not found with id: ${id}`, 404));
  }

  const updateData = {
    country_id: req.body.country_id || existingCity.country_id,
    name: req.body.name || existingCity.name,
    description: req.body.description || existingCity.description,
    status: req.body.status !== undefined ? req.body.status : existingCity.status
  };

  await CitiesDataModel.updateCityData(id, updateData);

  res.status(200).json({
    success: true,
    message: "City Data updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE
========================================================= */
export const deleteCityData = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingCity = await CitiesDataModel.getCityDataById(id);
  if (!existingCity) {
    return next(new ErrorHandler(`City Data not found with id: ${id}`, 404));
  }

  await CitiesDataModel.deleteCityData(id);

  res.status(200).json({
    success: true,
    message: "City Data deleted successfully"
  });
});