import path from 'path';
import fs from 'fs/promises';
import * as UserDocumentModel from "../../models/user/users_documents.model.js";
import catchAsyncErrors from "../../middleware/catchAsyncErrors.js";
import ErrorHandler from "../../utils/errorHandler.js";

/* =========================================================
   CREATE DOCUMENT
========================================================= */
export const createDocument = catchAsyncErrors(async (req, res, next) => {
  const { project_id, doc_type, id_number, expiry_date } = req.body;

  // Assuming file path comes from Multer (req.file)
  const attachment = req.file ? req.file.path : null;

  // Use authenticated user's ID
  const user_id = req.user.id;

  if (!doc_type) {
    return next(new ErrorHandler("Document type is required", 400));
  }

  const documentData = {
    user_id,
    project_id: project_id || null, // Optional
    doc_type,
    id_number,
    expiry_date,
    attachment
  };

  const result = await UserDocumentModel.createUserDocument(documentData);

  res.status(201).json({
    success: true,
    message: "Document created successfully",
    data: {
      id: result.insertId,
      ...documentData
    }
  });
});

/* =========================================================
   GET ALL DOCUMENTS (Admin)
========================================================= */
export const getAllDocuments = catchAsyncErrors(async (req, res, next) => {
  const documents = await UserDocumentModel.getAllUserDocuments();

  res.status(200).json({
    success: true,
    count: documents.length,
    documents
  });
});

/* =========================================================
   GET DOCUMENT BY ID
========================================================= */
export const getDocumentById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const document = await UserDocumentModel.getUserDocumentById(id);

  if (!document) {
    return next(new ErrorHandler(`Document not found with id: ${id}`, 404));
  }

  // Optional: Check if user owns the document or is admin
  if (document.user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorHandler("Not authorized to view this document", 403));
  }

  res.status(200).json({
    success: true,
    document
  });
});

/* =========================================================
   GET MY DOCUMENTS (Current User)
========================================================= */
export const getMyDocuments = catchAsyncErrors(async (req, res, next) => {
  const documents = await UserDocumentModel.getDocumentsByUserId(req.user.id);

  res.status(200).json({
    success: true,
    count: documents.length,
    documents
  });
});

/* =========================================================
   GET DOCUMENTS BY USER ID (Admin)
========================================================= */
export const getUserDocuments = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const documents = await UserDocumentModel.getDocumentsByUserId(userId);

  res.status(200).json({
    success: true,
    count: documents.length,
    documents
  });
});

/* =========================================================
   GET DOCUMENTS BY PROJECT ID
========================================================= */
export const getProjectDocuments = catchAsyncErrors(async (req, res, next) => {
  const { projectId } = req.params;
  const documents = await UserDocumentModel.getDocumentsByProjectId(projectId);

  res.status(200).json({
    success: true,
    count: documents.length,
    documents
  });
});

/* =========================================================
   UPDATE DOCUMENT
========================================================= */
export const updateDocument = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { project_id, doc_type, id_number, expiry_date } = req.body;

  // Check if document exists
  const existingDoc = await UserDocumentModel.getUserDocumentById(id);
  if (!existingDoc) {
    return next(new ErrorHandler(`Document not found with id: ${id}`, 404));
  }

  // Authorization check
  if (existingDoc.user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorHandler("Not authorized to update this document", 403));
  }

  let attachment = existingDoc.attachment;

  // If a new file is uploaded, delete the old one and set the new path
  if (req.file) {
    if (existingDoc.attachment) {
      try {
        await fs.unlink(existingDoc.attachment); // Delete old file
      } catch (error) {
        console.error("Error deleting old file:", error);
        // Continue even if delete fails
      }
    }
    attachment = req.file.path;
  }

  const updateData = {
    user_id: existingDoc.user_id, // Keep original owner
    project_id: project_id || existingDoc.project_id,
    doc_type: doc_type || existingDoc.doc_type,
    id_number: id_number || existingDoc.id_number,
    expiry_date: expiry_date || existingDoc.expiry_date,
    attachment: attachment
  };

  await UserDocumentModel.updateUserDocument(id, updateData);

  res.status(200).json({
    success: true,
    message: "Document updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE DOCUMENT
========================================================= */
export const deleteDocument = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const document = await UserDocumentModel.getUserDocumentById(id);

  if (!document) {
    return next(new ErrorHandler(`Document not found with id: ${id}`, 404));
  }

  // Authorization check
  if (document.user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorHandler("Not authorized to delete this document", 403));
  }

  // Delete physical file from storage
  if (document.attachment) {
    try {
      await fs.unlink(document.attachment);
    } catch (error) {
      console.error("Error deleting file from server:", error);
    }
  }

  await UserDocumentModel.deleteUserDocument(id);

  res.status(200).json({
    success: true,
    message: "Document deleted successfully"
  });
});