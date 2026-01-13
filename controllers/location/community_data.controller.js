import * as CommunityDataModel from '../../models/location/community_data.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

/* =========================================================
   CREATE
========================================================= */
export const createCommunityData = catchAsyncErrors(async (req, res, next) => {
  const { name, city_id } = req.body;

  if (!name) {
    return next(new ErrorHandler("Name is required", 400));
  }

  const result = await CommunityDataModel.createCommunityData(req.body);

  res.status(201).json({
    success: true,
    message: "Community Data created successfully",
    data: {
      id: result.insertId,
      ...req.body
    }
  });
});

/* =========================================================
   GET ALL
========================================================= */
export const getAllCommunityData = catchAsyncErrors(async (req, res, next) => {
  const communities = await CommunityDataModel.getAllCommunityData();

  res.status(200).json({
    success: true,
    count: communities.length,
    communities
  });
});

/* =========================================================
   GET BY ID
========================================================= */
export const getCommunityDataById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const community = await CommunityDataModel.getCommunityDataById(id);

  if (!community) {
    return next(new ErrorHandler(`Community Data not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    community
  });
});

/* =========================================================
   GET BY CITY ID
========================================================= */
export const getCommunityDataByCity = catchAsyncErrors(async (req, res, next) => {
  const { cityId } = req.params;
  const communities = await CommunityDataModel.getCommunityDataByCityId(cityId);

  res.status(200).json({
    success: true,
    count: communities.length,
    communities
  });
});

/* =========================================================
   UPDATE
========================================================= */
export const updateCommunityData = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existing = await CommunityDataModel.getCommunityDataById(id);
  if (!existing) {
    return next(new ErrorHandler(`Community Data not found with id: ${id}`, 404));
  }

  const updateData = {
    city_id: req.body.city_id || existing.city_id,
    state_id: req.body.state_id || existing.state_id,
    name: req.body.name || existing.name,
    status: req.body.status !== undefined ? req.body.status : existing.status
  };

  await CommunityDataModel.updateCommunityData(id, updateData);

  res.status(200).json({
    success: true,
    message: "Community Data updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE
========================================================= */
export const deleteCommunityData = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existing = await CommunityDataModel.getCommunityDataById(id);
  if (!existing) {
    return next(new ErrorHandler(`Community Data not found with id: ${id}`, 404));
  }

  await CommunityDataModel.deleteCommunityData(id);

  res.status(200).json({
    success: true,
    message: "Community Data deleted successfully"
  });
});