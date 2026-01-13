import * as CommentModel from '../../models/interactions/comments.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

/* =========================================================
   CREATE COMMENT
========================================================= */
export const createComment = catchAsyncErrors(async (req, res, next) => {
  const { p_id, type, comment } = req.body;

  if (!p_id || !type || !comment) {
    return next(new ErrorHandler("Parent ID, Type, and Comment text are required", 400));
  }

  // Use authenticated user ID if available
  const send_by = req.user ? req.user.id : null;

  const commentData = {
    ...req.body,
    send_by,
    send_date: new Date()
  };

  const result = await CommentModel.createComment(commentData);

  res.status(201).json({
    success: true,
    message: "Comment posted successfully",
    data: {
      id: result.insertId,
      ...commentData
    }
  });
});

/* =========================================================
   GET COMMENTS BY ENTITY
========================================================= */
export const getCommentsByEntity = catchAsyncErrors(async (req, res, next) => {
  const { type, pid } = req.params;
  const comments = await CommentModel.getCommentsByEntity(pid, type);

  res.status(200).json({
    success: true,
    count: comments.length,
    comments
  });
});

/* =========================================================
   GET ALL COMMENTS (Admin)
========================================================= */
export const getAllComments = catchAsyncErrors(async (req, res, next) => {
  const comments = await CommentModel.getAllComments();

  res.status(200).json({
    success: true,
    count: comments.length,
    comments
  });
});

/* =========================================================
   UPDATE COMMENT (Reply or Edit)
========================================================= */
export const updateComment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingComment = await CommentModel.getCommentById(id);
  if (!existingComment) {
    return next(new ErrorHandler(`Comment not found with id: ${id}`, 404));
  }

  // Logic for replying (Admin)
  let replyData = {};
  if (req.body.reply_text && req.user && req.user.role === 'admin') {
     // This implies editing the comment to include reply details
     // or you might want to create a NEW comment row as a reply.
     // Based on your schema having `replyed_by` and `replyed_date`, 
     // it looks like a single-level reply structure within the same row OR tracking who acted on it.
     
     // Assuming here we are updating the record to show it was replied to/processed:
     replyData = {
       replyed_by: req.user.id,
       replyed_date: new Date(),
       status: 1 // Mark as handled/active
     };
  }

  const updateData = {
    p_id: req.body.p_id || existingComment.p_id,
    type: req.body.type || existingComment.type,
    send_by: existingComment.send_by, // Usually doesn't change
    replyed_by: replyData.replyed_by || existingComment.replyed_by,
    send_date: existingComment.send_date,
    replyed_date: replyData.replyed_date || existingComment.replyed_date,
    comment: req.body.comment || existingComment.comment,
    status: req.body.status !== undefined ? req.body.status : existingComment.status
  };

  await CommentModel.updateComment(id, updateData);

  res.status(200).json({
    success: true,
    message: "Comment updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE COMMENT
========================================================= */
export const deleteComment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingComment = await CommentModel.getCommentById(id);
  if (!existingComment) {
    return next(new ErrorHandler(`Comment not found with id: ${id}`, 404));
  }

  // Authorization check (Admin or Owner)
  if (req.user.role !== 'admin' && existingComment.send_by !== req.user.id) {
     return next(new ErrorHandler("Not authorized to delete this comment", 403));
  }

  await CommentModel.deleteComment(id);

  res.status(200).json({
    success: true,
    message: "Comment deleted successfully"
  });
});