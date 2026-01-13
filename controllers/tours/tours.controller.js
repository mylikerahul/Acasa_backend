import * as TourModel from "../../models/tours/tours.model.js";
import catchAsyncErrors from "../../middleware/catchAsyncErrors.js";
import ErrorHandler from "../../utils/errorHandler.js";

/* =========================================================
   CREATE TOUR
========================================================= */
export const createTour = catchAsyncErrors(async (req, res, next) => {
  const { first_name, email, phone, time } = req.body;

  if (!first_name || !email || !phone || !time) {
    return next(new ErrorHandler("Name, Email, Phone and Time are required", 400));
  }

  const tourData = {
    ...req.body,
    status: req.body.status || 'Pending'
  };

  const result = await TourModel.createTour(tourData);

  res.status(201).json({
    success: true,
    message: "Tour scheduled successfully",
    data: {
      id: result.insertId,
      ...tourData
    }
  });
});

/* =========================================================
   GET ALL TOURS (Admin)
========================================================= */
export const getAllTours = catchAsyncErrors(async (req, res, next) => {
  const tours = await TourModel.getAllTours();

  res.status(200).json({
    success: true,
    count: tours.length,
    tours
  });
});

/* =========================================================
   GET MY TOURS (Agent)
========================================================= */
export const getMyTours = catchAsyncErrors(async (req, res, next) => {
  // Assuming logged-in user is an agent
  const tours = await TourModel.getToursByAgentId(req.user.id);

  res.status(200).json({
    success: true,
    count: tours.length,
    tours
  });
});

/* =========================================================
   GET TOUR BY ID
========================================================= */
export const getTourById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const tour = await TourModel.getTourById(id);

  if (!tour) {
    return next(new ErrorHandler(`Tour not found with id: ${id}`, 404));
  }

  // Optional: Add authorization check so agents only see their own tours
  // if (req.user.role !== 'admin' && tour.agent_id !== req.user.id) { ... }

  res.status(200).json({
    success: true,
    tour
  });
});

/* =========================================================
   UPDATE TOUR
========================================================= */
export const updateTour = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingTour = await TourModel.getTourById(id);
  if (!existingTour) {
    return next(new ErrorHandler(`Tour not found with id: ${id}`, 404));
  }

  // Merge existing data
  const updateData = {
    project_name: req.body.project_name || existingTour.project_name,
    refrence: req.body.refrence || existingTour.refrence,
    location: req.body.location || existingTour.location,
    property_id: req.body.property_id || existingTour.property_id,
    agent_id: req.body.agent_id || existingTour.agent_id,
    first_name: req.body.first_name || existingTour.first_name,
    last_name: req.body.last_name || existingTour.last_name,
    email: req.body.email || existingTour.email,
    phone: req.body.phone || existingTour.phone,
    contact_type: req.body.contact_type || existingTour.contact_type,
    time: req.body.time || existingTour.time,
    status: req.body.status || existingTour.status
  };

  await TourModel.updateTour(id, updateData);

  res.status(200).json({
    success: true,
    message: "Tour details updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE TOUR
========================================================= */
export const deleteTour = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingTour = await TourModel.getTourById(id);
  if (!existingTour) {
    return next(new ErrorHandler(`Tour not found with id: ${id}`, 404));
  }

  await TourModel.deleteTour(id);

  res.status(200).json({
    success: true,
    message: "Tour deleted successfully"
  });
});