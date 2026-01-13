import path from 'path';
import fs from 'fs/promises';
import * as BlogsModel from '../../models/blogs/blogs.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

/* =========================================================
   CREATE BLOG
========================================================= */
export const createBlog = catchAsyncErrors(async (req, res, next) => {
  const { title, slug } = req.body;

  if (!title || !slug) {
    return next(new ErrorHandler("Title and Slug are required", 400));
  }

  // Check unique slug
  const existing = await BlogsModel.getBlogBySlug(slug);
  if (existing) {
    return next(new ErrorHandler("Slug already exists", 409));
  }

  // Handle Image Upload
  const imageurl = req.file ? req.file.path : null;

  const blogData = {
    ...req.body,
    imageurl,
    // Default writer to logged in user if not provided
    writer: req.body.writer || (req.user ? req.user.name : 'Admin'), 
    publish_date: req.body.publish_date || new Date()
  };

  const result = await BlogsModel.createBlog(blogData);

  res.status(201).json({
    success: true,
    message: "Blog post created successfully",
    data: {
      id: result.insertId,
      ...blogData
    }
  });
});

/* =========================================================
   GET ALL BLOGS
========================================================= */
export const getAllBlogs = catchAsyncErrors(async (req, res, next) => {
  const blogs = await BlogsModel.getAllBlogs();

  res.status(200).json({
    success: true,
    count: blogs.length,
    blogs
  });
});

/* =========================================================
   GET BLOG BY ID
========================================================= */
export const getBlogById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const blog = await BlogsModel.getBlogById(id);

  if (!blog) {
    return next(new ErrorHandler(`Blog not found with id: ${id}`, 404));
  }

  res.status(200).json({
    success: true,
    blog
  });
});

/* =========================================================
   GET BLOG BY SLUG (Public View)
========================================================= */
export const getBlogBySlug = catchAsyncErrors(async (req, res, next) => {
  const { slug } = req.params;
  const blog = await BlogsModel.getBlogBySlug(slug);

  if (!blog) {
    return next(new ErrorHandler(`Blog not found with slug: ${slug}`, 404));
  }

  res.status(200).json({
    success: true,
    blog
  });
});

/* =========================================================
   UPDATE BLOG
========================================================= */
export const updateBlog = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingBlog = await BlogsModel.getBlogById(id);
  if (!existingBlog) {
    return next(new ErrorHandler(`Blog not found with id: ${id}`, 404));
  }

  let imageurl = existingBlog.imageurl;

  // Handle File Replacement
  if (req.file) {
    if (existingBlog.imageurl) {
      try {
        await fs.unlink(existingBlog.imageurl);
      } catch (error) {
        console.error("Error deleting old blog image:", error);
      }
    }
    imageurl = req.file.path;
  }

  const updateData = {
    title: req.body.title || existingBlog.title,
    slug: req.body.slug || existingBlog.slug,
    sub_title: req.body.sub_title || existingBlog.sub_title,
    writer: req.body.writer || existingBlog.writer,
    publish_date: req.body.publish_date || existingBlog.publish_date,
    category: req.body.category || existingBlog.category,
    descriptions: req.body.descriptions || existingBlog.descriptions,
    status: req.body.status || existingBlog.status,
    seo_title: req.body.seo_title || existingBlog.seo_title,
    seo_keywork: req.body.seo_keywork || existingBlog.seo_keywork,
    seo_description: req.body.seo_description || existingBlog.seo_description,
    imageurl: imageurl
  };

  await BlogsModel.updateBlog(id, updateData);

  res.status(200).json({
    success: true,
    message: "Blog updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE BLOG
========================================================= */
export const deleteBlog = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existingBlog = await BlogsModel.getBlogById(id);
  if (!existingBlog) {
    return next(new ErrorHandler(`Blog not found with id: ${id}`, 404));
  }

  // Delete associated image
  if (existingBlog.imageurl) {
    try {
      await fs.unlink(existingBlog.imageurl);
    } catch (error) {
      console.error("Error deleting blog image:", error);
    }
  }

  await BlogsModel.deleteBlog(id);

  res.status(200).json({
    success: true,
    message: "Blog deleted successfully"
  });
});