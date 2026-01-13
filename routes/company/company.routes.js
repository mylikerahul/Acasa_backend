import express from 'express';
import * as companyController from '../../controllers/company/company.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// Create new Company (Admin or Registration)
router.post(
  '/create', 
  // isAuthenticated, // Uncomment depending on whether public registration is allowed
  companyController.createCompany
);

// Get All Companies (Admin)
router.get(
  '/all', 
  isAuthenticated, 
  isAdmin, 
  companyController.getAllCompanies
);

// Get Company by CUID (Public identifier)
router.get(
  '/cuid/:cuid', 
  companyController.getCompanyByCuid
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(isAuthenticated, companyController.getCompanyById)
  .put(isAuthenticated, isAdmin, companyController.updateCompany)
  .delete(isAuthenticated, isAdmin, companyController.deleteCompany);

export default router;