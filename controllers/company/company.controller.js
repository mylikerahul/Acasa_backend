import * as CompanyModel from "../../models/company/company.model.js";
import catchAsyncErrors from "../../middleware/catchAsyncErrors.js";
import ErrorHandler from "../../utils/errorHandler.js";
import { v4 as uuidv4 } from 'uuid'; // Optional, useful for generating CUIDs

/* =========================================================
   CREATE COMPANY
========================================================= */
export const createCompany = catchAsyncErrors(async (req, res, next) => {
  const { company_name, email } = req.body;

  if (!company_name || !email) {
    return next(new ErrorHandler("Company Name and Email are required", 400));
  }

  // Generate CUID if not provided
  const cuid = req.body.cuid || uuidv4();

  // Check CUID uniqueness
  if (req.body.cuid) {
    const existing = await CompanyModel.getCompanyByCuid(req.body.cuid);
    if (existing) {
      return next(new ErrorHandler("Company with this CUID already exists", 409));
    }
  }

  const companyData = {
    ...req.body,
    cuid
  };

  const result = await CompanyModel.createCompany(companyData);

  res.status(201).json({
    success: true,
    message: "Company registered successfully",
    data: {
      id: result.insertId,
      ...companyData
    }
  });
});

/* =========================================================
   GET ALL COMPANIES
========================================================= */
export const getAllCompanies = catchAsyncErrors(async (req, res, next) => {
  const companies = await CompanyModel.getAllCompanies();

  res.status(200).json({
    success: true,
    count: companies.length,
    companies
  });
});

/* =========================================================
   GET COMPANY BY ID
========================================================= */
export const getCompanyById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const company = await CompanyModel.getCompanyById(id);

  if (!company) {
    return next(new ErrorHandler(`Company not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    company
  });
});

/* =========================================================
   GET COMPANY BY CUID
========================================================= */
export const getCompanyByCuid = catchAsyncErrors(async (req, res, next) => {
  const { cuid } = req.params;
  const company = await CompanyModel.getCompanyByCuid(cuid);

  if (!company) {
    return next(new ErrorHandler(`Company not found with CUID: ${cuid}`, 404));
  }

  res.status(200).json({
    success: true,
    company
  });
});

/* =========================================================
   UPDATE COMPANY
========================================================= */
export const updateCompany = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingCompany = await CompanyModel.getCompanyById(id);
  if (!existingCompany) {
    return next(new ErrorHandler(`Company not found with id: ${id}`, 404));
  }

  const updateData = {
    cuid: req.body.cuid || existingCompany.cuid,
    company_field: req.body.company_field || existingCompany.company_field,
    company_name: req.body.company_name || existingCompany.company_name,
    email: req.body.email || existingCompany.email,
    trade_licence: req.body.trade_licence || existingCompany.trade_licence,
    referral: req.body.referral || existingCompany.referral,
    owner_name: req.body.owner_name || existingCompany.owner_name,
    mobile: req.body.mobile || existingCompany.mobile
  };

  await CompanyModel.updateCompany(id, updateData);

  res.status(200).json({
    success: true,
    message: "Company details updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE COMPANY
========================================================= */
export const deleteCompany = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingCompany = await CompanyModel.getCompanyById(id);
  if (!existingCompany) {
    return next(new ErrorHandler(`Company not found with id: ${id}`, 404));
  }

  await CompanyModel.deleteCompany(id);

  res.status(200).json({
    success: true,
    message: "Company deleted successfully"
  });
});