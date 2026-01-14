/**
 * @fileoverview Complete Database Schema Initialization Module
 * @description Initializes all application tables with proper dependency management.
 *
 * @author Rahul Sharma
 * @version 3.2.0
 * @license MIT
 */

// ============================================
// Required Models - Organized by Dependency Level
// ============================================

// --- Level 1: Core & Independent Tables (No FK Dependencies) ---
import * as UserModel from '../models/user/user.model.js';
import * as AdminMenusModel from '../models/admin/admin_menus.model.js';
import * as CitiesModel from '../models/cities/cities.model.js';
import * as BuildingStyleModel from '../models/properties/building_style.model.js';
import * as CommercialAmenitiesModel from '../models/properties/commercial_amenities.model.js';
import * as ColumnActionModel from '../models/settings/column_action.model.js';
import * as AgencyModel from '../models/agency/agency.model.js';
import * as CompanyModel from '../models/company/company.model.js';
import * as BlogsModel from '../models/blogs/blogs.model.js';
import * as BlocksModel from '../models/blocks/blocks.model.js';
import * as AreasModel from '../models/areas/areas.model.js';
import * as initializeDatabase  from '../utils/initDatabase.js';

// --- Level 2: Primary Entity Tables (Depend on Level 1) ---
import * as UserPermissionsModel from '../models/user/user_permissions.model.js';
import * as AdminMenuItemsModel from '../models/admin/admin_menu_items.model.js';
import * as AdminSubmenuModel from '../models/admin/admin_submenu.model.js';
import * as CitiesDataModel from '../models/location/cities_data.model.js';
import * as CommunityModel from '../models/location/community.model.js';
import * as CommunityDataModel from '../models/location/community_data.model.js';
import * as DevelopersModel from '../models/developers/developer.model.js';
import * as JobModel from '../models/jobs/jobs.model.js';

// --- Level 3: Properties & Projects (Core Business Entities) ---
import * as PropertiesModel from '../models/properties/properties.model.js';
import * as ProjectsModel from '../models/projects/project.model.js';

// --- Level 4: Operational Tables (Depend on Users, Properties, Projects) ---
import * as UserDocumentsModel from '../models/user/users_documents.model.js';
import * as UnitsModel from '../models/units/units.model.js';
import * as ToursModel from '../models/tours/tours.model.js';
import * as EnquireModel from '../models/enquiries/enquire.model.js';
import * as LeadsModel from '../models/leads/leads.model.js';
import * as CommentsModel from '../models/interactions/comments.model.js';
import * as DealsModel from '../models/deals/deals.model.js';
// --- Level 5: Transaction & Payment Tables (Highest Dependencies) ---
import * as TransactionsModel from '../models/transactions/transactions.model.js';
import * as CommunitiesModel from '../models/communities/communities.model.js';
import * as AgentsModel from '../models/agent/agent.model.js';
import * as ContactUsModel from '../models/contact_us/contact_us.model.js';
import * as WebControlModel from '../models/webcontrol/webcontrol.model.js';
import * as FacilitiesModel from '../models/facilities/facilities.model.js';
import * as CtaegoryModel from '../models/ctaegory/ctaegory.model.js';
import * as NoticesModel from '../models/notices/notices.models.js';
import * as TaskModel from '../models/task/task.model.js';
import * as ActivityModel from '../models/activity/activity.model.js';
import * as AnalyticsModel from '../models/analytics/analytics.models.js';
import * as LifestyleModel from '../models/lifestyle/lifestyle.model.js';
import * as SubCommunitiesModel from '../models/sub_community/sub_community.model.js';










/**
 * Complete schema configuration with dependency hierarchy
 */
const SCHEMA_CONFIG = [
  {
    level: 1,
    name: 'Core Foundation Tables',
    description: 'Independent tables - no foreign key dependencies',
    tables: [
      {
        name: 'users',
        init: UserModel.createUserTable,
        critical: true,
        description: 'Application users and authentication'
      },
      {
        name: 'communities_master', // Renamed to avoid confusion with the CommunityModel in Level 2
        init: CommunitiesModel.createCommunityTable, // This one is from communities/communities.model.js
        critical: true,
        description: 'Communities master data'
      },
      {
        name: 'users_migration',
        init: UserModel.runMigrations,
        description: 'User table schema migrations'
      },
      {
        name: 'admin_menus',
        init: AdminMenusModel.createAdminMenuTable,
        description: 'CMS menu structure parent table'
      },
      {
        name: 'cities',
        init: CitiesModel.createCitiesTable,
        description: 'Cities master data'
      },
      {
        name: 'cities',
        init: initializeDatabase,
        description: 'Cities master data'
      },
      {
        name: 'deals',
        init: DealsModel.createDealsTable,
        description: 'Deals data'
      },
      {
        name: 'agent',
        init: AgentsModel.createAgentTable,
        description: 'Agent data'
      }, 
        {
        name: 'subcommunities',
        init: SubCommunitiesModel.createSubCommunityTable,
        description: 'Agent data'
      }, 
     
       {
        name: 'analytics',
        init: AnalyticsModel.createAnalyticsTable ,
        description: 'Agent data'
      }, 
      {
        name: 'facilities',
        init: FacilitiesModel.createFacilitiesTable,
        description: 'Agent data'
      },
       {
        name: 'ctaegory',
        init: CtaegoryModel.createCtaegoryTable,
        description: 'Agent data'
      },
       {
        name: 'contact',
        init: ContactUsModel.createContactUsTable,
        description: 'Contact Us messages'
      },
        {
        name: 'notices',
        init: NoticesModel.createNoticesTable,
        description: 'Contact Us messages'
      },
      {
        name: 'building_style',
        init: BuildingStyleModel.createBuildingStyleTable,
        description: 'Property building style categories'
      },
      {
        name: 'commercial_amenities',
        init: CommercialAmenitiesModel.createCommercialAmenitiesTable,
        description: 'Amenities specific to commercial properties'
      },
      {
        name: 'column_action',
        init: ColumnActionModel.createColumnActionTable,
        description: 'Dynamic column actions configuration'
      },
      {
        name: 'agency',
        init: AgencyModel.createAgencyTable,
        description: 'Real estate agencies'
      },
       {
        name: 'webcontrol',
        init: WebControlModel.createWebControlTable,
        description: 'Real estate agencies'
      },
       {
        name: 'webcontrol',
        init: LifestyleModel.createLifestylesTable,
        description: 'Real estate agencies'
      },
      {
        name: 'company',
        init: CompanyModel.createCompanyTable,
        description: 'Corporate entities'
      },
      {
        name: 'blogs',
        init: BlogsModel.createBlogsTable,
        description: 'Blog posts and articles'
      },
      {
        name: 'blocks',
        init: BlocksModel.createBlocksTable,
        description: 'Page blocks and content sections'
      },
      {
        name: 'areas',
        init: AreasModel.createAreasTable,
        description: 'Geographic areas'
      }
    ]
  },
  {
    level: 2,
    name: 'Primary Entity Tables',
    description: 'Main content tables depending on Level 1',
    tables: [
      {
        name: 'user_permissions',
        init: UserPermissionsModel.createUserPermissionTable,
        description: 'User-role-permission mappings'
      },
      {
        name: 'admin_menu_items',
        init: AdminMenuItemsModel.createAdminMenuItemTable,
        description: 'CMS menu items (child of admin_menus)'
      },
      {
        name: 'admin_submenu',
        init: AdminSubmenuModel.createAdminSubmenuTable,
        description: 'CMS submenu items'
      },
      {
        name: 'cities_data',
        init: CitiesDataModel.createCitiesDataTable,
        description: 'Extended city information'
      },
      {
        name: 'community',
        init: CommunityModel.createCommunityTable,
        description: 'Residential communities master'
      },
       {
        name: 'community',
        init: TaskModel.createTasksTable,
        description: 'Residential communities master'
      },
      {
        name: 'community_data',
        init: CommunityDataModel.createCommunityDataTable,
        description: 'Extended community information'
      },
      {
        name: 'developers',
        init: DevelopersModel.createDeveloperTable,
        description: 'Developer records'
      },
      {
        name: 'jobs',
        init: JobModel.createJobsTable,
        description: 'Job applications'
      }
    ]
  },
  {
    level: 3,
    name: 'Properties & Projects',
    description: 'Core real estate business entities',
    tables: [
      {
        name: 'properties_all_tables',
        init: PropertiesModel.createPropertyTables,
        critical: true,
        description: 'All property-related tables'
      },
      {
        name: 'projects_all_tables',
        init: ProjectsModel.createProjectTables,
        critical: true,
        description: 'All project-related tables'
      }
    ]
  },
  {
    level: 4,
    name: 'Operational & Dependent Tables',
    description: 'Tables depending on Users and Projects',
    tables: [
      {
        name: 'users_documents',
        init: UserDocumentsModel.createUserDocumentTable,
        description: 'User uploaded documents'
      },
      {
        name: 'units',
        init: UnitsModel.createUnitTable,
        description: 'Individual units within projects'
      },
      {
        name: 'tours',
        init: ToursModel.createTourTable,
        description: 'Property tour appointments'
      },
      {
        name: 'tours',
        init: ActivityModel.createRecentActivityTable,
        description: 'Property tour appointments'
      },
      {
        name: 'enquire',
        init: EnquireModel.createEnquireTable,
        description: 'Customer enquiries'
      },
      {
        name: 'leads',
        init: LeadsModel.createLeadsTable,
        description: 'Sales leads generated'
      },
      {
        name: 'comments',
        init: CommentsModel.createCommentsTable,
        description: 'Comments and interactions'
      }
    ]
  },
  {
    level: 5,
    name: 'Financial Tables',
    description: 'Transaction and payment records',
    tables: [
      {
        name: 'transactions',
        init: TransactionsModel.createTransactionTable,
        description: 'Financial transactions record'
      }
    ]
  }
];

/**
 * Initialize database tables with developer-friendly error logging
 */
export const initializeModels = async ({
  silent = false,
  stopOnError = true,
  levels = null
} = {}) => {
  const startTime = Date.now();
  const stats = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
    duration: 0,
    byLevel: {}
  };

  // Helper logger functions (now strictly controlled by 'silent' flag)
  const _logError = (msg, details = '') => {
    // Always log errors, regardless of silent flag, as they are critical.
    console.error(`[SCHEMA ERROR] ${msg}`);
    if (details) console.error(`   Details: ${details}`);
  };

  const _logWarn = (msg, details = '') => {
    // Log warnings if not silent
    if (!silent) {
        console.warn(`[SCHEMA WARNING] ${msg}`);
        if (details) console.warn(`   Details: ${details}`);
    }
  };

  const _logInfo = (msg) => {
    if (!silent) { // Only log info messages if not in silent mode
      console.log(`[SCHEMA INFO] ${msg}`);
    }
  };

  const _logSuccess = (msg) => {
    // This is typically for overall success, not individual tables.
    // Individual table successes are suppressed when silent.
    if (!silent) {
      console.log(`[SCHEMA SUCCESS] ${msg}`);
    }
  };

  try {
    _logInfo('Starting database schema initialization...');

    const levelsToProcess = levels
      ? SCHEMA_CONFIG.filter(l => levels.includes(l.level))
      : SCHEMA_CONFIG;

    for (const level of levelsToProcess) {
      stats.byLevel[level.level] = {
        name: level.name,
        success: 0,
        failed: 0,
        total: level.tables.length
      };
      stats.total += level.tables.length;

      for (const table of level.tables) {
        try {
          if (typeof table.init !== 'function') {
            throw new Error(`Init function not found for "${table.name}". Export check karein.`);
          }

          await table.init();
          stats.success++;
          stats.byLevel[level.level].success++;
          // --- CHANGE HERE: Removed individual success logs.
          // _logInfo(`Table '${table.name}' created/checked.`); // If you want minimal per-table success log when not silent

        } catch (err) {
          stats.failed++;
          stats.byLevel[level.level].failed++;

          const errorInfo = {
            level: level.level,
            table: table.name,
            timestamp: new Date().toISOString(),
            error: err.message,
            stack: err.stack
          };
          stats.errors.push(errorInfo);

          // Detailed error log for developer debugging (always shown)
          _logError(`Table initialization failed: ${table.name}`, err.message);
          console.error(`   Level: ${level.level} | Critical: ${table.critical ? 'Yes' : 'No'}`);
          console.error(`   Model File: Check ${table.name}.model.js`);

          if (err.code) console.error(`   Error Code: ${err.code}`);
          if (err.sql) console.error(`   SQL Query: ${err.sql}`);

          if (table.critical && stopOnError) {
            _logError(`CRITICAL TABLE FAILED - Stopping execution`);
            throw new Error(`Critical table "${table.name}" failed: ${err.message}`);
          }
        }
      }
    }

    stats.duration = Date.now() - startTime;

    // Final summary (always show errors if any, otherwise a success message)
    if (stats.failed > 0) {
      console.log('\n' + '='.repeat(60));
      _logWarn(`INITIALIZATION COMPLETE WITH ERRORS`);
      _logInfo(`Duration: ${stats.duration}ms`);
      _logInfo(`Success: ${stats.success} | Failed: ${stats.failed}`);

      console.log('\nFailed Tables:');
      stats.errors.forEach(err => {
        console.error(`  - ${err.table} (Level ${err.level}): ${err.error}`);
      });

      console.log('\nTroubleshooting Steps:');
      console.log('  1. Check model exports in corresponding .model.js files');
      console.log('  2. Verify database connection permissions');
      console.log('  3. Check foreign key dependencies and their creation order');
      console.log('  4. Run individual table init for debugging');
      console.log('='.repeat(60));

    } else {
      _logSuccess(`Schema initialization completed successfully!`);
      _logInfo(`Time: ${stats.duration}ms | Tables: ${stats.success}`);
    }

    return stats;

  } catch (err) {
    stats.duration = Date.now() - startTime;

    console.error('\n' + '='.repeat(60));
    _logError('CRITICAL INITIALIZATION FAILURE'); // Use _logError here
    console.error('='.repeat(60));
    console.error(`Error: ${err.message}`);
    console.error(`Time elapsed: ${stats.duration}ms`);
    console.error(`Successful tables: ${stats.success}`);
    console.error(`Failed tables: ${stats.failed}`);

    if (stats.errors.length > 0) {
      console.error('\nError Log:');
      stats.errors.forEach((e, i) => {
        console.error(`${i+1}. ${e.table}: ${e.error}`);
      });
    }

    console.error('\nImmediate Actions:');
    console.error('  1. Check the last failed table above');
    console.error('  2. Verify database user has CREATE TABLE privileges');
    console.error('  3. Check for existing tables with same names');
    console.error('  4. Review model file exports');
    console.error('='.repeat(60));

    throw err;
  }
};

/**
 * Debug individual table initialization
 */
export const debugTable = async (tableName) => {
  const table = SCHEMA_CONFIG.flatMap(l => l.tables).find(t => t.name === tableName);

  if (!table) {
    console.error(`[SCHEMA ERROR] Table "${tableName}" not found in schema config`);
    return;
  }

  console.log(`\n[SCHEMA INFO] Debugging table: ${tableName}`);
  console.log(`[SCHEMA INFO] Level: ${SCHEMA_CONFIG.find(l => l.tables.includes(table)).level}`);
  console.log(`[SCHEMA INFO] Critical: ${table.critical ? 'Yes' : 'No'}`);
  console.log(`[SCHEMA INFO] Description: ${table.description}`);
  console.log(`[SCHEMA INFO] Init function type: ${typeof table.init}`);

  try {
    console.log('\n[SCHEMA INFO] Attempting initialization...');
    await table.init();
    console.log('[SCHEMA SUCCESS] Table initialized successfully');
  } catch (err) {
    console.error('[SCHEMA ERROR] Initialization failed:');
    console.error(`   Error: ${err.message}`);
    console.error(`   Stack: ${err.stack}`);
  }
};

/**
 * Get critical tables for emergency recovery
 */
export const getCriticalTables = () => {
  const critical = SCHEMA_CONFIG.flatMap(l =>
    l.tables.filter(t => t.critical).map(t => t.name)
  );

  console.log('\n[SCHEMA INFO] CRITICAL TABLES (Must be initialized):');
  critical.forEach(t => console.log(`  - ${t}`));
  return critical;
};

/**
 * Quick validation check
 */
export const validateSchema = () => {
  const issues = [];

  SCHEMA_CONFIG.forEach(level => {
    level.tables.forEach(table => {
      if (typeof table.init !== 'function') {
        issues.push({
          level: level.level,
          table: table.name,
          issue: 'Init function missing/invalid'
        });
      }
    });
  });

  if (issues.length === 0) {
    console.log('[SCHEMA SUCCESS] Schema configuration is valid');
    return { valid: true };
  }

  console.error('\n[SCHEMA ERROR] Schema validation issues found:');
  issues.forEach(issue => {
    console.error(`  - ${issue.table} (Level ${issue.level}): ${issue.issue}`);
  });

  return { valid: false, issues };
};

export default initializeModels;