/**
 * @fileoverview Express Routes Initialization Module
 * @description Registers all application routes
 * 
 * @author Rahul Sharma
 * @version 3.2.0
 * @license MIT
 */

// ============================================
// Required Routes
// ============================================

// --- User & Auth ---
import userRoutes from '../routes/users/user.routes.js';
import userDocumentRoutes from '../routes/users/users_documents.routes.js';
import userPermissionRoutes from '../routes/users/user_permissions.routes.js';

// --- Properties ---
import propertiesRoutes from '../routes/properties/properties.routes.js';
import buildingStyleRoutes from '../routes/properties/building_style.routes.js';
import commercialAmenitiesRoutes from '../routes/properties/commercial_amenities.routes.js';

// --- Projects ---
import projectsRoutes from '../routes/projects/project.routes.js';
import unitsRoutes from '../routes/units/units.routes.js';

// --- Locations ---
import citiesRoutes from '../routes/location/cities.routes.js';
import dealsRoutes from '../routes/Deals/Deals.routes.js';
import citiesDataRoutes from '../routes/location/cities_data.routes.js';
import areasRoutes from '../routes/areas/areas.routes.js';
import communityDataRoutes from '../routes/location/community_data.routes.js';

// --- CMS & Content ---
import adminMenuRoutes from '../routes/admin/admin_menus.routes.js';
import adminMenuItemRoutes from '../routes/admin/admin_menu_items.routes.js';
import adminSubmenuRoutes from '../routes/admin/admin_submenu.routes.js';
import blogsRoutes from '../routes/blogs/blogs.routes.js';
import blocksRoutes from '../routes/blocks/blocks.routes.js';

// --- Business Directory ---
import agencyRoutes from '../routes/agency/agency.routes.js';
import companyRoutes from '../routes/company/company.routes.js';
import developerRoutes from '../routes/developers/developer.routes.js';

// --- Sales, CRM ---
import leadRoutes from '../routes/leads/leads.routes.js';
import enquireRoutes from '../routes/enquiries/enquire.routes.js';
import tourRoutes from '../routes/tours/tours.routes.js';
import commentRoutes from '../routes/interactions/comments.routes.js';

// --- HR & Operations ---
import jobRoutes from '../routes/jobs/Jobs.routes.js';
import lifestyleRoutes from '../routes/lifestyle/lifestyle.routes.js';


// --- Settings ---
import columnActionRoutes from '../routes/settings/column_action.routes.js';

// --- Finance ---
import transactionRoutes from '../routes/transactions/transactions.routes.js';

// --- Additional Modules ---
import communitiesRoutes from '../routes/Communities/Communities.routes.js';
import agentsRoutes from '../routes/agent/agent.routes.js';
import contactUsRoutes from '../routes/contact_us/contact_us.routes.js';
import webControlRoutes from '../routes/webcontrol/webcontrol.routes.js';
import facilitiesRoutes from '../routes/facilities/facilities.routes.js';
import categoryRoutes from '../routes/ctaegory/ctaegory.routes.js';
import noticesRoutes from '../routes/notices/notices.routes.js';
import taskRoutes from '../routes/task/task.routes.js';
import activityRoutes from '../routes/activity/activity.routes.js';
import analyticsRoutes from '../routes/analytics/analytics.routes.js';

/**
 * API version prefix
 */
const API_PREFIX = '/api/v1';

/**
 * Routes Configuration Grouped by Functionality
 */
const ROUTES_CONFIG = [
  {
    name: 'User Management',
    routes: [
      {
        path: '/users',
        handler: userRoutes,
        description: 'User login, register, profile management'
      },
      {
        path: '/users-documents',
        handler: userDocumentRoutes,
        description: 'User KYC and document uploads'
      },
      {
        path: '/user-permissions',
        handler: userPermissionRoutes,
        description: 'Role-based access control'
      }
    ]
  },
  {
    name: 'Locations & Areas',
    routes: [
      {
        path: '/cities',
        handler: citiesRoutes,
        description: 'Cities master data'
      },
      {
        path: '/deals',
        handler: dealsRoutes,
        description: 'Deals management'
      },
      {
        path: '/agents',
        handler: agentsRoutes,
        description: 'Agents management'
      },
      {
        path: '/cities-data',
        handler: citiesDataRoutes,
        description: 'Extended city information'
      },
      {
        path: '/areas',
        handler: areasRoutes,
        description: 'Geographic areas'
      },
      {
        path: '/communities',
        handler: communitiesRoutes,
        description: 'Residential communities'
      },
      {
        path: '/communities-data',
        handler: communityDataRoutes,
        description: 'Extended community information'
      }
    ]
  },
  {
    name: 'Properties Management',
    routes: [
      {
        path: '/properties',
        handler: propertiesRoutes,
        description: 'Property listings CRUD, gallery, types, saved properties'
      },
      {
        path: '/building-styles',
        handler: buildingStyleRoutes,
        description: 'Building architecture styles'
      },
      {
        path: '/commercial-amenities',
        handler: commercialAmenitiesRoutes,
        description: 'Commercial property amenities'
      }
    ]
  },
  {
    name: 'Projects Management',
    routes: [
      {
        path: '/projects',
        handler: projectsRoutes,
        description: 'Complete project management'
      },
      {
        path: '/units',
        handler: unitsRoutes,
        description: 'Individual units/flats within projects'
      }
    ]
  },
  {
    name: 'CMS & Content',
    routes: [
      {
        path: '/admin-menus',
        handler: adminMenuRoutes,
        description: 'CMS Menu structure'
      },
      {
        path: '/admin-menu-items',
        handler: adminMenuItemRoutes,
        description: 'CMS Menu items'
      },
      {
        path: '/admin-submenu',
        handler: adminSubmenuRoutes,
        description: 'CMS Submenu items'
      },
      {
        path: '/blogs',
        handler: blogsRoutes,
        description: 'Blog posts'
      },
      {
        path: '/blocks',
        handler: blocksRoutes,
        description: 'Page content blocks'
      }
    ]
  },
  {
    name: 'Business Directory',
    routes: [
      {
        path: '/agencies',
        handler: agencyRoutes,
        description: 'Real estate agencies'
      },
      {
        path: '/companies',
        handler: companyRoutes,
        description: 'Corporate entities'
      },
      {
        path: '/developers',
        handler: developerRoutes,
        description: 'Developer documents'
      },
         {
        path: '/recent-activity',
        handler: activityRoutes,
        description: 'Developer documents'
      }
    ]
  },
  {
    name: 'Sales & CRM',
    routes: [
      {
        path: '/leads',
        handler: leadRoutes,
        description: 'Sales leads'
      },
      {
        path: '/enquiries',
        handler: enquireRoutes,
        description: 'Customer enquiries'
      },
      {
        path: '/tours',
        handler: tourRoutes,
        description: 'Property viewing appointments'
      },
      {
        path: '/comments',
        handler: commentRoutes,
        description: 'Feedback and comments'
      }
    ]
  },
  {
    name: 'HR & Operations',
    routes: [
      {
        path: '/jobs',
        handler: jobRoutes,
        description: 'Job applications'
      },
       {
        path: '/lifestyle',
        handler: lifestyleRoutes,
        description: 'Job applications'
      }
    ]
  },
  {
    name: 'Finance',
    routes: [
      {
        path: '/transactions',
        handler: transactionRoutes,
        description: 'Financial transactions'
      }
    ]
  },
  {
    name: 'System & Settings',
    routes: [
      {
        path: '/settings/column-actions',
        handler: columnActionRoutes,
        description: 'Table column configurations'
      }
    ]
  },
  {
    name: 'Additional Features',
    routes: [
      {
        path: '/webcontrol',
        handler: webControlRoutes,
        description: 'Web control settings'
      },
      {
        path: '/analytics',
        handler: analyticsRoutes,
        description: 'Analytics data'
      },
      {
        path: '/category',
        handler: categoryRoutes,
        description: 'Category management'
      },
      {
        path: '/notices',
        handler: noticesRoutes,
        description: 'Notices and announcements'
      },
      {
        path: '/tasks',
        handler: taskRoutes,
        description: 'Task management'
      },
      {
        path: '/activity',
        handler: activityRoutes,
        description: 'Activity logs'
      },
      {
        path: '/facilities',
        handler: facilitiesRoutes,
        description: 'Facilities management'
      },
      {
        path: '/contact',
        handler: contactUsRoutes,
        description: 'Contact us form submissions'
      }
    ]
  }
];

/**
 * Initialize API routes
 * 
 * @param {Express} app - Express application instance
 * @param {Object} options - Configuration options
 * @returns {Object} Route initialization statistics
 */
export const initializeRoutes = (
  app,
  { silent = false, logEndpoints = false } = {}
) => {
  const stats = {
    totalGroups: ROUTES_CONFIG.length,
    totalRoutes: 0,
    endpoints: [],
    groupStats: {}
  };

  try {
    if (!silent) {
      console.log('[ROUTES] Starting API routes initialization...');
      console.log(`[ROUTES] Total module groups: ${ROUTES_CONFIG.length}`);
    }

    for (const group of ROUTES_CONFIG) {
      stats.groupStats[group.name] = {
        count: group.routes.length,
        endpoints: []
      };

      if (logEndpoints) {
        console.log(`--- ${group.name} ---`);
      }

      for (const route of group.routes) {
        const fullPath = `${API_PREFIX}${route.path}`;
        
        app.use(fullPath, route.handler);
        stats.totalRoutes++;
        stats.endpoints.push(fullPath);
        stats.groupStats[group.name].endpoints.push(fullPath);

        if (logEndpoints) {
          console.log(`  ${fullPath}`);
        }
      }
    }

    if (!silent) {
      console.log(`[ROUTES] Success: ${stats.totalRoutes} route modules loaded`);
    }

    return stats;

  } catch (err) {
    console.error('[ROUTES ERROR] Initialization failed:', err.message);
    throw err;
  }
};

/**
 * Get all registered endpoints
 */
export const getEndpoints = () =>
  ROUTES_CONFIG.flatMap(g => g.routes.map(r => `${API_PREFIX}${r.path}`));

/**
 * Get routes configuration
 */
export const getRoutesConfig = () => ROUTES_CONFIG;

/**
 * Print routes overview
 */
export const printRoutesOverview = () => {
  console.log('\n' + '='.repeat(60));
  console.log('API ROUTES OVERVIEW');
  console.log('='.repeat(60) + '\n');

  ROUTES_CONFIG.forEach(group => {
    console.log(`${group.name}`);
    group.routes.forEach(route => {
      console.log(`  ${API_PREFIX}${route.path} - ${route.description}`);
    });
    console.log('');
  });

  const totalRoutes = ROUTES_CONFIG.reduce((a, g) => a + g.routes.length, 0);
  console.log('='.repeat(60));
  console.log(`Groups: ${ROUTES_CONFIG.length} | Routes: ${totalRoutes}`);
  console.log('='.repeat(60) + '\n');
};

/**
 * Validate route handlers
 */
export const validateRoutes = () => {
  const issues = [];
  
  ROUTES_CONFIG.forEach(group => {
    group.routes.forEach(route => {
      if (typeof route.handler !== 'function') {
        issues.push({
          group: group.name,
          path: route.path,
          issue: 'Route handler is not a valid Express middleware'
        });
      }
    });
  });

  if (issues.length > 0) {
    console.error('[ROUTES VALIDATION] Issues found:');
    issues.forEach(issue => {
      console.error(`  ${issue.group}: ${issue.path} - ${issue.issue}`);
    });
    return { valid: false, issues };
  }

  console.log('[ROUTES VALIDATION] All routes are valid');
  return { valid: true };
};

export default initializeRoutes;