import * as NoticeModel from '../../models/notices/notices.models.js';

import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== VALID OPTIONS ====================
const VALID_TYPES = ['information', 'warning', 'alert', 'announcement', 'update', 'reminder'];
const VALID_ASSIGN_TO = ['everyone', 'team', 'specific_user'];
const VALID_PRIORITY = ['low', 'normal', 'high', 'urgent'];

// ==================== CREATE NOTICE ====================
export const createNotice = catchAsyncErrors(async (req, res, next) => {
    const {
        title,
        headings,
        description,
        assign,
        date,
        slug,
        descriptions,
        seo_title,
        seo_keywork,
        seo_description
    } = req.body;

    // Validate required fields
    if (!title || !slug) {
        return next(new ErrorHandler('Title and slug are required', 400));
    }

    // Check if slug already exists
    const existingNotice = await NoticeModel.getNoticeBySlug(slug);
    if (existingNotice) {
        return next(new ErrorHandler('Notice with this slug already exists', 400));
    }

    const noticeData = {
        title,
        headings: headings || null,
        description: description || null,
        assign: assign || null,
        date: date || new Date().toISOString().split('T')[0], // Default to today's date
        slug,
        descriptions: descriptions || null,
        seo_title: seo_title || null,
        seo_keywork: seo_keywork || null,
        seo_description: seo_description || null
    };

    const result = await NoticeModel.createNotice(noticeData);
    
    const newNotice = await NoticeModel.getNoticeById(result.insertId);

    res.status(201).json({
        success: true,
        message: 'Notice created successfully',
        data: newNotice
    });
});

// ==================== GET ALL NOTICES ====================
export const getAllNotices = catchAsyncErrors(async (req, res, next) => {
    const notices = await NoticeModel.getAllNotices();

    res.status(200).json({
        success: true,
        count: notices.length,
        data: notices
    });
});

// ==================== GET NOTICE BY ID ====================
export const getNoticeById = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
        return next(new ErrorHandler('Please provide a valid notice ID', 400));
    }

    const notice = await NoticeModel.getNoticeById(parseInt(id));

    if (!notice) {
        return next(new ErrorHandler('Notice not found', 404));
    }

    res.status(200).json({
        success: true,
        data: notice
    });
});

// ==================== GET NOTICE BY SLUG ====================
export const getNoticeBySlug = catchAsyncErrors(async (req, res, next) => {
    const { slug } = req.params;

    if (!slug) {
        return next(new ErrorHandler('Please provide a slug', 400));
    }

    const notice = await NoticeModel.getNoticeBySlug(slug);

    if (!notice) {
        return next(new ErrorHandler('Notice not found', 404));
    }

    res.status(200).json({
        success: true,
        data: notice
    });
});

// ==================== UPDATE NOTICE ====================
export const updateNotice = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const {
        title,
        headings,
        description,
        assign,
        date,
        slug,
        descriptions,
        seo_title,
        seo_keywork,
        seo_description
    } = req.body;

    if (!id || isNaN(id)) {
        return next(new ErrorHandler('Please provide a valid notice ID', 400));
    }

    // Check if notice exists
    const existingNotice = await NoticeModel.getNoticeById(parseInt(id));
    if (!existingNotice) {
        return next(new ErrorHandler('Notice not found', 404));
    }

    // Check if slug already exists for another notice
    if (slug && slug !== existingNotice.slug) {
        const noticeWithSlug = await NoticeModel.getNoticeBySlug(slug);
        if (noticeWithSlug && noticeWithSlug.id !== parseInt(id)) {
            return next(new ErrorHandler('Another notice with this slug already exists', 400));
        }
    }

    const updateData = {
        title: title || existingNotice.title,
        headings: headings !== undefined ? headings : existingNotice.headings,
        description: description !== undefined ? description : existingNotice.description,
        assign: assign !== undefined ? assign : existingNotice.assign,
        date: date || existingNotice.date,
        slug: slug || existingNotice.slug,
        descriptions: descriptions !== undefined ? descriptions : existingNotice.descriptions,
        seo_title: seo_title !== undefined ? seo_title : existingNotice.seo_title,
        seo_keywork: seo_keywork !== undefined ? seo_keywork : existingNotice.seo_keywork,
        seo_description: seo_description !== undefined ? seo_description : existingNotice.seo_description
    };

    await NoticeModel.updateNotice(parseInt(id), updateData);
    
    const updatedNotice = await NoticeModel.getNoticeById(parseInt(id));

    res.status(200).json({
        success: true,
        message: 'Notice updated successfully',
        data: updatedNotice
    });
});

// ==================== DELETE NOTICE ====================
export const deleteNotice = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
        return next(new ErrorHandler('Please provide a valid notice ID', 400));
    }

    // Check if notice exists
    const existingNotice = await NoticeModel.getNoticeById(parseInt(id));
    if (!existingNotice) {
        return next(new ErrorHandler('Notice not found', 404));
    }

    await NoticeModel.deleteNotice(parseInt(id));

    res.status(200).json({
        success: true,
        message: 'Notice deleted successfully'
    });
});

// ==================== SEARCH NOTICES ====================
export const searchNotices = catchAsyncErrors(async (req, res, next) => {
    const { query } = req.query;

    if (!query) {
        return next(new ErrorHandler('Please provide a search query', 400));
    }

    // Get all notices and filter by search query
    const allNotices = await NoticeModel.getAllNotices();
    
    const filteredNotices = allNotices.filter(notice => {
        const searchableFields = [
            notice.title,
            notice.headings,
            notice.description,
            notice.assign,
            notice.slug,
            notice.descriptions
        ].join(' ').toLowerCase();
        
        return searchableFields.includes(query.toLowerCase());
    });

    res.status(200).json({
        success: true,
        count: filteredNotices.length,
        data: filteredNotices
    });
});

// ==================== GET NOTICES BY ASSIGNEE ====================
export const getNoticesByAssignee = catchAsyncErrors(async (req, res, next) => {
    const { assignee } = req.params;

    if (!assignee) {
        return next(new ErrorHandler('Please provide an assignee', 400));
    }

    const notices = await NoticeModel.getNoticesByAssignee(assignee);

    res.status(200).json({
        success: true,
        count: notices.length,
        data: notices
    });
});

// ==================== GET NOTICES BY DATE RANGE ====================
export const getNoticesByDateRange = catchAsyncErrors(async (req, res, next) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return next(new ErrorHandler('Please provide both start and end dates', 400));
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return next(new ErrorHandler('Please provide dates in YYYY-MM-DD format', 400));
    }

    const notices = await NoticeModel.getNoticesByDateRange(startDate, endDate);

    res.status(200).json({
        success: true,
        count: notices.length,
        data: notices
    });
});

// ==================== GET RECENT NOTICES ====================
export const getRecentNotices = catchAsyncErrors(async (req, res, next) => {
    const { limit = 5 } = req.query;
    
    const allNotices = await NoticeModel.getAllNotices();
    const recentNotices = allNotices.slice(0, parseInt(limit));

    res.status(200).json({
        success: true,
        count: recentNotices.length,
        data: recentNotices
    });
});