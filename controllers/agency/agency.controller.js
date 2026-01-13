import * as AgencyModel from "../../models/agency/agency.model.js";
import catchAsyncErrors from "../../middleware/catchAsyncErrors.js";
import ErrorHandler from "../../utils/errorHandler.js";
import { v4 as uuidv4 } from 'uuid'; // Optional: for generating CUID if not provided

/* =========================================================
   CREATE AGENCY
========================================================= */
export const createAgency = catchAsyncErrors(async (req, res, next) => {
  const { owner_name, office_name, email } = req.body;

  if (!owner_name || !office_name || !email) {
    return next(new ErrorHandler("Owner Name, Office Name, and Email are required", 400));
  }

  // Auto-generate CUID if not provided
  const cuid = req.body.cuid || uuidv4();

  // Check uniqueness of CUID if manually provided
  if (req.body.cuid) {
    const existing = await AgencyModel.getAgencyByCuid(req.body.cuid);
    if (existing) {
      return next(new ErrorHandler("Agency with this CUID already exists", 409));
    }
  }

  const agencyData = {
    ...req.body,
    cuid
  };

  const result = await AgencyModel.createAgency(agencyData);

  res.status(201).json({
    success: true,
    message: "Agency registered successfully",
    data: {
      id: result.insertId,
      ...agencyData
    }
  });
});

/* =========================================================
   GET ALL AGENCIES
========================================================= */
export const getAllAgencies = catchAsyncErrors(async (req, res, next) => {
  const agencies = await AgencyModel.getAllAgencies();

  res.status(200).json({
    success: true,
    count: agencies.length,
    agencies
  });
});

/* =========================================================
   GET AGENCY BY ID
========================================================= */
export const getAgencyById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const agency = await AgencyModel.getAgencyById(id);

  if (!agency) {
    return next(new ErrorHandler(`Agency not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    agency
  });
});

/* =========================================================
   GET AGENCY BY CUID (Useful for API lookups)
========================================================= */
export const getAgencyByCuid = catchAsyncErrors(async (req, res, next) => {
  const { cuid } = req.params;
  const agency = await AgencyModel.getAgencyByCuid(cuid);

  if (!agency) {
    return next(new ErrorHandler(`Agency not found with CUID: ${cuid}`, 404));
  }

  res.status(200).json({
    success: true,
    agency
  });
});

/* =========================================================
   UPDATE AGENCY
========================================================= */
export const updateAgency = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingAgency = await AgencyModel.getAgencyById(id);
  if (!existingAgency) {
    return next(new ErrorHandler(`Agency not found with id: ${id}`, 404));
  }

  // Merge existing data
  const updateData = {
    cuid: req.body.cuid || existingAgency.cuid,
    owner_name: req.body.owner_name || existingAgency.owner_name,
    office_name: req.body.office_name || existingAgency.office_name,
    email: req.body.email || existingAgency.email,
    phone: req.body.phone || existingAgency.phone,
    orn: req.body.orn || existingAgency.orn,
    status: req.body.status || existingAgency.status
  };

  await AgencyModel.updateAgency(id, updateData);

  res.status(200).json({
    success: true,
    message: "Agency details updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE AGENCY
========================================================= */
export const deleteAgency = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingAgency = await AgencyModel.getAgencyById(id);
  if (!existingAgency) {
    return next(new ErrorHandler(`Agency not found with id: ${id}`, 404));
  }

  await AgencyModel.deleteAgency(id);

  res.status(200).json({
    success: true,
    message: "Agency deleted successfully"
  });
});