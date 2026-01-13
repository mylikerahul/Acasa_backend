import path from 'path';
import fs from 'fs';
import * as FacilitiesModel from '../../models/facilities/facilities.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';

// ==================== CONSTANTS ====================
const UPLOAD_BASE_PATH = 'facilities';
const ITEMS_PER_PAGE = 20;
const API_BASE_URL = process.env.API_URL;

// ==================== LOGGER ====================
const _logError = (msg, errorDetails = '') => {
  console.error(`[FacilitiesController ERROR] ${msg}`);
  if (errorDetails) console.error(`   Details: ${errorDetails}`);
};

const _logInfo = (msg) => {
  console.log(`[FacilitiesController INFO] ${msg}`);
};

// ==================== HELPER FUNCTIONS ====================
const buildImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE_URL}/uploads/${UPLOAD_BASE_PATH}/${imagePath}`;
};

const deleteFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      _logInfo(`File deleted: ${filePath}`);
    }
  } catch (error) {
    _logError('Error deleting file', error.message);
  }
};

const formatFacilityResponse = (facility) => {
  if (!facility) return null;
  
  return {
    ...facility,
    // Convert boolean fields from 0/1 to true/false
    kitchen_open_plan: Boolean(facility.kitchen_open_plan),
    kitchen_closed: Boolean(facility.kitchen_closed),
    back_kitchen: Boolean(facility.back_kitchen),
    dry_pantry: Boolean(facility.dry_pantry),
    maid_quarters: Boolean(facility.maid_quarters),
    driver_quarters: Boolean(facility.driver_quarters),
    storage_room: Boolean(facility.storage_room),
    laundry_room: Boolean(facility.laundry_room),
    study_room: Boolean(facility.study_room),
    games_room: Boolean(facility.games_room),
    library: Boolean(facility.library),
    cinema_room: Boolean(facility.cinema_room),
    landing_area: Boolean(facility.landing_area),
    wine_cellar: Boolean(facility.wine_cellar),
    terraces: Boolean(facility.terraces),
    balconies: Boolean(facility.balconies),
    basement: Boolean(facility.basement),
    furnished: Boolean(facility.furnished),
    built_in_wardrobes: Boolean(facility.built_in_wardrobes),
    walk_in_closets: Boolean(facility.walk_in_closets),
    smart_home_technology: Boolean(facility.smart_home_technology),
    equipped_kitchen: Boolean(facility.equipped_kitchen),
    equipped_laundry: Boolean(facility.equipped_laundry),
    reception_service: Boolean(facility.reception_service),
    concierge_service: Boolean(facility.concierge_service),
    valet_parking: Boolean(facility.valet_parking),
    swimming_pool: Boolean(facility.swimming_pool),
    swimming_pool_private: Boolean(facility.swimming_pool_private),
    swimming_pool_communal: Boolean(facility.swimming_pool_communal),
    swimming_pool_overflow: Boolean(facility.swimming_pool_overflow),
    swimming_pool_heated: Boolean(facility.swimming_pool_heated),
    swimming_pool_infinity: Boolean(facility.swimming_pool_infinity),
    swimming_pool_cooled: Boolean(facility.swimming_pool_cooled),
    swimming_pool_standard: Boolean(facility.swimming_pool_standard),
    swimming_pool_both: Boolean(facility.swimming_pool_both),
    jacuzzi: Boolean(facility.jacuzzi),
    steam_room: Boolean(facility.steam_room),
    sauna: Boolean(facility.sauna),
    gymnasium: Boolean(facility.gymnasium),
    gymnasium_private: Boolean(facility.gymnasium_private),
    gymnasium_communal: Boolean(facility.gymnasium_communal),
    gymnasium_both: Boolean(facility.gymnasium_both),
    tennis_court: Boolean(facility.tennis_court),
    squash_court: Boolean(facility.squash_court),
    basketball_court: Boolean(facility.basketball_court),
    golf_course: Boolean(facility.golf_course),
    bbq: Boolean(facility.bbq),
    private_elevator: Boolean(facility.private_elevator),
    child_play_area: Boolean(facility.child_play_area),
    allocated_parking: Boolean(facility.allocated_parking)
  };
};

// ==================== CREATE FACILITY ====================
export const createFacility = catchAsyncErrors(async (req, res, next) => {
  const facilityData = req.body;

  // Validate required fields
  if (!facilityData.property_id) {
    return next(new ErrorHandler('Property ID is required', 400));
  }

  // Check if facility already exists for this property
  const existingFacility = await FacilitiesModel.facilityExists(facilityData.property_id);
  if (existingFacility.exists) {
    return next(new ErrorHandler('Facility already exists for this property. Use update instead.', 400));
  }

  // Convert string 'true'/'false' to boolean
  const booleanFields = [
    'kitchen_open_plan', 'kitchen_closed', 'back_kitchen', 'dry_pantry',
    'maid_quarters', 'driver_quarters', 'storage_room', 'laundry_room',
    'study_room', 'games_room', 'library', 'cinema_room', 'landing_area',
    'wine_cellar', 'terraces', 'balconies', 'basement', 'furnished',
    'built_in_wardrobes', 'walk_in_closets', 'smart_home_technology',
    'equipped_kitchen', 'equipped_laundry', 'reception_service',
    'concierge_service', 'valet_parking', 'swimming_pool',
    'swimming_pool_private', 'swimming_pool_communal', 'swimming_pool_overflow',
    'swimming_pool_heated', 'swimming_pool_infinity', 'swimming_pool_cooled',
    'swimming_pool_standard', 'swimming_pool_both', 'jacuzzi', 'steam_room',
    'sauna', 'gymnasium', 'gymnasium_private', 'gymnasium_communal',
    'gymnasium_both', 'tennis_court', 'squash_court', 'basketball_court',
    'golf_course', 'bbq', 'private_elevator', 'child_play_area', 'allocated_parking'
  ];

  booleanFields.forEach(field => {
    if (facilityData[field] !== undefined) {
      facilityData[field] = facilityData[field] === 'true' || facilityData[field] === true;
    }
  });

  // Convert quantity fields to integers
  const intFields = [
    'maid_quarters_qty', 'storage_room_qty', 'study_room_qty', 'terraces_qty',
    'balconies_qty', 'built_in_wardrobes_qty', 'walk_in_closets_qty',
    'swimming_pool_qty', 'jacuzzi_qty', 'tennis_court_qty', 'squash_court_qty',
    'bbq_qty', 'private_elevator_qty', 'allocated_parking_qty'
  ];

  intFields.forEach(field => {
    if (facilityData[field] !== undefined) {
      facilityData[field] = parseInt(facilityData[field], 10) || 0;
    }
  });

  const result = await FacilitiesModel.createFacility(facilityData);

  if (!result.success) {
    return next(new ErrorHandler('Failed to create facility', 500));
  }

  // Fetch the created facility
  const createdFacility = await FacilitiesModel.getFacilityById(result.id);

  res.status(201).json({
    success: true,
    message: 'Facility created successfully',
    data: formatFacilityResponse(createdFacility.data)
  });
});

// ==================== GET ALL FACILITIES ====================
export const getAllFacilities = catchAsyncErrors(async (req, res, next) => {
  const {
    page = 1,
    limit = ITEMS_PER_PAGE,
    status,
    property_id,
    type,
    furnished,
    swimming_pool,
    gymnasium
  } = req.query;

  const filters = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    status,
    property_id,
    type,
    furnished: furnished !== undefined ? furnished === 'true' : undefined,
    swimming_pool: swimming_pool !== undefined ? swimming_pool === 'true' : undefined,
    gymnasium: gymnasium !== undefined ? gymnasium === 'true' : undefined
  };

  const result = await FacilitiesModel.getAllFacilities(filters);

  if (!result.success) {
    return next(new ErrorHandler('Failed to fetch facilities', 500));
  }

  const formattedData = result.data.map(formatFacilityResponse);

  res.status(200).json({
    success: true,
    message: 'Facilities fetched successfully',
    data: formattedData,
    pagination: result.pagination
  });
});

// ==================== GET FACILITY BY ID ====================
export const getFacilityById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ErrorHandler('Facility ID is required', 400));
  }

  const result = await FacilitiesModel.getFacilityById(id);

  if (!result.success) {
    return next(new ErrorHandler('Facility not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Facility fetched successfully',
    data: formatFacilityResponse(result.data)
  });
});

// ==================== GET FACILITY BY PROPERTY ID ====================
export const getFacilityByPropertyId = catchAsyncErrors(async (req, res, next) => {
  const { propertyId } = req.params;

  if (!propertyId) {
    return next(new ErrorHandler('Property ID is required', 400));
  }

  const result = await FacilitiesModel.getFacilityByPropertyId(propertyId);

  if (!result.success) {
    return next(new ErrorHandler('Failed to fetch facility', 500));
  }

  const formattedData = result.data.map(formatFacilityResponse);

  res.status(200).json({
    success: true,
    message: 'Facility fetched successfully',
    data: formattedData
  });
});

// ==================== UPDATE FACILITY ====================
export const updateFacility = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!id) {
    return next(new ErrorHandler('Facility ID is required', 400));
  }

  // Check if facility exists
  const existingFacility = await FacilitiesModel.getFacilityById(id);
  if (!existingFacility.success) {
    return next(new ErrorHandler('Facility not found', 404));
  }

  // Convert string 'true'/'false' to boolean
  const booleanFields = [
    'kitchen_open_plan', 'kitchen_closed', 'back_kitchen', 'dry_pantry',
    'maid_quarters', 'driver_quarters', 'storage_room', 'laundry_room',
    'study_room', 'games_room', 'library', 'cinema_room', 'landing_area',
    'wine_cellar', 'terraces', 'balconies', 'basement', 'furnished',
    'built_in_wardrobes', 'walk_in_closets', 'smart_home_technology',
    'equipped_kitchen', 'equipped_laundry', 'reception_service',
    'concierge_service', 'valet_parking', 'swimming_pool',
    'swimming_pool_private', 'swimming_pool_communal', 'swimming_pool_overflow',
    'swimming_pool_heated', 'swimming_pool_infinity', 'swimming_pool_cooled',
    'swimming_pool_standard', 'swimming_pool_both', 'jacuzzi', 'steam_room',
    'sauna', 'gymnasium', 'gymnasium_private', 'gymnasium_communal',
    'gymnasium_both', 'tennis_court', 'squash_court', 'basketball_court',
    'golf_course', 'bbq', 'private_elevator', 'child_play_area', 'allocated_parking'
  ];

  booleanFields.forEach(field => {
    if (updateData[field] !== undefined) {
      updateData[field] = updateData[field] === 'true' || updateData[field] === true;
    }
  });

  // Convert quantity fields to integers
  const intFields = [
    'maid_quarters_qty', 'storage_room_qty', 'study_room_qty', 'terraces_qty',
    'balconies_qty', 'built_in_wardrobes_qty', 'walk_in_closets_qty',
    'swimming_pool_qty', 'jacuzzi_qty', 'tennis_court_qty', 'squash_court_qty',
    'bbq_qty', 'private_elevator_qty', 'allocated_parking_qty'
  ];

  intFields.forEach(field => {
    if (updateData[field] !== undefined) {
      updateData[field] = parseInt(updateData[field], 10) || 0;
    }
  });

  const result = await FacilitiesModel.updateFacility(id, updateData);

  if (!result.success) {
    return next(new ErrorHandler(result.message || 'Failed to update facility', 400));
  }

  // Fetch updated facility
  const updatedFacility = await FacilitiesModel.getFacilityById(id);

  res.status(200).json({
    success: true,
    message: 'Facility updated successfully',
    data: formatFacilityResponse(updatedFacility.data)
  });
});

// ==================== UPDATE FACILITY BY PROPERTY ID ====================
export const updateFacilityByPropertyId = catchAsyncErrors(async (req, res, next) => {
  const { propertyId } = req.params;
  const updateData = req.body;

  if (!propertyId) {
    return next(new ErrorHandler('Property ID is required', 400));
  }

  // Check if facility exists for this property
  const existingFacility = await FacilitiesModel.getFacilityByPropertyId(propertyId);
  
  if (!existingFacility.success || existingFacility.data.length === 0) {
    return next(new ErrorHandler('Facility not found for this property', 404));
  }

  const facilityId = existingFacility.data[0].id;

  // Convert string 'true'/'false' to boolean
  const booleanFields = [
    'kitchen_open_plan', 'kitchen_closed', 'back_kitchen', 'dry_pantry',
    'maid_quarters', 'driver_quarters', 'storage_room', 'laundry_room',
    'study_room', 'games_room', 'library', 'cinema_room', 'landing_area',
    'wine_cellar', 'terraces', 'balconies', 'basement', 'furnished',
    'built_in_wardrobes', 'walk_in_closets', 'smart_home_technology',
    'equipped_kitchen', 'equipped_laundry', 'reception_service',
    'concierge_service', 'valet_parking', 'swimming_pool',
    'swimming_pool_private', 'swimming_pool_communal', 'swimming_pool_overflow',
    'swimming_pool_heated', 'swimming_pool_infinity', 'swimming_pool_cooled',
    'swimming_pool_standard', 'swimming_pool_both', 'jacuzzi', 'steam_room',
    'sauna', 'gymnasium', 'gymnasium_private', 'gymnasium_communal',
    'gymnasium_both', 'tennis_court', 'squash_court', 'basketball_court',
    'golf_course', 'bbq', 'private_elevator', 'child_play_area', 'allocated_parking'
  ];

  booleanFields.forEach(field => {
    if (updateData[field] !== undefined) {
      updateData[field] = updateData[field] === 'true' || updateData[field] === true;
    }
  });

  // Convert quantity fields to integers
  const intFields = [
    'maid_quarters_qty', 'storage_room_qty', 'study_room_qty', 'terraces_qty',
    'balconies_qty', 'built_in_wardrobes_qty', 'walk_in_closets_qty',
    'swimming_pool_qty', 'jacuzzi_qty', 'tennis_court_qty', 'squash_court_qty',
    'bbq_qty', 'private_elevator_qty', 'allocated_parking_qty'
  ];

  intFields.forEach(field => {
    if (updateData[field] !== undefined) {
      updateData[field] = parseInt(updateData[field], 10) || 0;
    }
  });

  const result = await FacilitiesModel.updateFacility(facilityId, updateData);

  if (!result.success) {
    return next(new ErrorHandler(result.message || 'Failed to update facility', 400));
  }

  // Fetch updated facility
  const updatedFacility = await FacilitiesModel.getFacilityById(facilityId);

  res.status(200).json({
    success: true,
    message: 'Facility updated successfully',
    data: formatFacilityResponse(updatedFacility.data)
  });
});

// ==================== DELETE FACILITY (SOFT DELETE) ====================
export const deleteFacility = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ErrorHandler('Facility ID is required', 400));
  }

  // Check if facility exists
  const existingFacility = await FacilitiesModel.getFacilityById(id);
  if (!existingFacility.success) {
    return next(new ErrorHandler('Facility not found', 404));
  }

  const result = await FacilitiesModel.deleteFacility(id);

  if (!result.success) {
    return next(new ErrorHandler(result.message || 'Failed to delete facility', 400));
  }

  res.status(200).json({
    success: true,
    message: 'Facility deleted successfully'
  });
});

// ==================== HARD DELETE FACILITY ====================
export const hardDeleteFacility = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ErrorHandler('Facility ID is required', 400));
  }

  // Check if facility exists
  const existingFacility = await FacilitiesModel.getFacilityById(id);
  if (!existingFacility.success) {
    return next(new ErrorHandler('Facility not found', 404));
  }

  const result = await FacilitiesModel.hardDeleteFacility(id);

  if (!result.success) {
    return next(new ErrorHandler(result.message || 'Failed to delete facility permanently', 400));
  }

  res.status(200).json({
    success: true,
    message: 'Facility permanently deleted'
  });
});

// ==================== DELETE FACILITY BY PROPERTY ID ====================
export const deleteFacilityByPropertyId = catchAsyncErrors(async (req, res, next) => {
  const { propertyId } = req.params;

  if (!propertyId) {
    return next(new ErrorHandler('Property ID is required', 400));
  }

  const result = await FacilitiesModel.deleteFacilityByPropertyId(propertyId);

  if (!result.success) {
    return next(new ErrorHandler(result.message || 'Failed to delete facilities', 400));
  }

  res.status(200).json({
    success: true,
    message: 'Facilities deleted successfully',
    affectedRows: result.affectedRows
  });
});

// ==================== RESTORE FACILITY ====================
export const restoreFacility = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new ErrorHandler('Facility ID is required', 400));
  }

  const result = await FacilitiesModel.restoreFacility(id);

  if (!result.success) {
    return next(new ErrorHandler(result.message || 'Failed to restore facility', 400));
  }

  // Fetch restored facility
  const restoredFacility = await FacilitiesModel.getFacilityById(id);

  res.status(200).json({
    success: true,
    message: 'Facility restored successfully',
    data: formatFacilityResponse(restoredFacility.data)
  });
});

// ==================== SEARCH FACILITIES ====================
export const searchFacilities = catchAsyncErrors(async (req, res, next) => {
  const {
    hasPool,
    hasGym,
    isFurnished,
    hasParking,
    minParkingSpaces,
    hasMaidQuarters,
    hasSmartHome,
    hasPrivateElevator,
    furnishType
  } = req.query;

  const searchCriteria = {
    hasPool: hasPool === 'true',
    hasGym: hasGym === 'true',
    isFurnished: isFurnished === 'true',
    hasParking: hasParking === 'true',
    minParkingSpaces: minParkingSpaces ? parseInt(minParkingSpaces, 10) : undefined,
    hasMaidQuarters: hasMaidQuarters === 'true',
    hasSmartHome: hasSmartHome === 'true',
    hasPrivateElevator: hasPrivateElevator === 'true',
    furnishType
  };

  // Remove undefined values
  Object.keys(searchCriteria).forEach(key => {
    if (searchCriteria[key] === undefined || searchCriteria[key] === false) {
      delete searchCriteria[key];
    }
  });

  const result = await FacilitiesModel.searchFacilities(searchCriteria);

  if (!result.success) {
    return next(new ErrorHandler('Failed to search facilities', 500));
  }

  const formattedData = result.data.map(formatFacilityResponse);

  res.status(200).json({
    success: true,
    message: 'Facilities search completed',
    data: formattedData,
    count: result.count
  });
});

// ==================== GET FACILITY STATISTICS ====================
export const getFacilityStatistics = catchAsyncErrors(async (req, res, next) => {
  const result = await FacilitiesModel.getFacilityStatistics();

  if (!result.success) {
    return next(new ErrorHandler('Failed to fetch facility statistics', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Facility statistics fetched successfully',
    data: result.data
  });
});

// ==================== BULK CREATE FACILITIES ====================
export const bulkCreateFacilities = catchAsyncErrors(async (req, res, next) => {
  const { facilities } = req.body;

  if (!facilities || !Array.isArray(facilities) || facilities.length === 0) {
    return next(new ErrorHandler('Facilities array is required', 400));
  }

  // Validate each facility has property_id
  for (const facility of facilities) {
    if (!facility.property_id) {
      return next(new ErrorHandler('Each facility must have a property_id', 400));
    }
  }

  const result = await FacilitiesModel.bulkCreateFacilities(facilities);

  if (!result.success) {
    return next(new ErrorHandler('Failed to create facilities', 500));
  }

  res.status(201).json({
    success: true,
    message: `${result.ids.length} facilities created successfully`,
    ids: result.ids
  });
});

// ==================== CHECK FACILITY EXISTS ====================
export const checkFacilityExists = catchAsyncErrors(async (req, res, next) => {
  const { propertyId } = req.params;

  if (!propertyId) {
    return next(new ErrorHandler('Property ID is required', 400));
  }

  const result = await FacilitiesModel.facilityExists(propertyId);

  res.status(200).json({
    success: true,
    exists: result.exists
  });
});

// ==================== CREATE OR UPDATE FACILITY ====================
export const createOrUpdateFacility = catchAsyncErrors(async (req, res, next) => {
  const facilityData = req.body;

  if (!facilityData.property_id) {
    return next(new ErrorHandler('Property ID is required', 400));
  }

  // Check if facility exists for this property
  const existingFacility = await FacilitiesModel.getFacilityByPropertyId(facilityData.property_id);

  // Convert string 'true'/'false' to boolean
  const booleanFields = [
    'kitchen_open_plan', 'kitchen_closed', 'back_kitchen', 'dry_pantry',
    'maid_quarters', 'driver_quarters', 'storage_room', 'laundry_room',
    'study_room', 'games_room', 'library', 'cinema_room', 'landing_area',
    'wine_cellar', 'terraces', 'balconies', 'basement', 'furnished',
    'built_in_wardrobes', 'walk_in_closets', 'smart_home_technology',
    'equipped_kitchen', 'equipped_laundry', 'reception_service',
    'concierge_service', 'valet_parking', 'swimming_pool',
    'swimming_pool_private', 'swimming_pool_communal', 'swimming_pool_overflow',
    'swimming_pool_heated', 'swimming_pool_infinity', 'swimming_pool_cooled',
    'swimming_pool_standard', 'swimming_pool_both', 'jacuzzi', 'steam_room',
    'sauna', 'gymnasium', 'gymnasium_private', 'gymnasium_communal',
    'gymnasium_both', 'tennis_court', 'squash_court', 'basketball_court',
    'golf_course', 'bbq', 'private_elevator', 'child_play_area', 'allocated_parking'
  ];

  booleanFields.forEach(field => {
    if (facilityData[field] !== undefined) {
      facilityData[field] = facilityData[field] === 'true' || facilityData[field] === true;
    }
  });

  // Convert quantity fields to integers
  const intFields = [
    'maid_quarters_qty', 'storage_room_qty', 'study_room_qty', 'terraces_qty',
    'balconies_qty', 'built_in_wardrobes_qty', 'walk_in_closets_qty',
    'swimming_pool_qty', 'jacuzzi_qty', 'tennis_court_qty', 'squash_court_qty',
    'bbq_qty', 'private_elevator_qty', 'allocated_parking_qty'
  ];

  intFields.forEach(field => {
    if (facilityData[field] !== undefined) {
      facilityData[field] = parseInt(facilityData[field], 10) || 0;
    }
  });

  let result;
  let isCreated = false;

  if (existingFacility.success && existingFacility.data.length > 0) {
    // Update existing facility
    const facilityId = existingFacility.data[0].id;
    result = await FacilitiesModel.updateFacility(facilityId, facilityData);
    
    if (!result.success) {
      return next(new ErrorHandler('Failed to update facility', 500));
    }
    
    result.id = facilityId;
  } else {
    // Create new facility
    result = await FacilitiesModel.createFacility(facilityData);
    isCreated = true;
    
    if (!result.success) {
      return next(new ErrorHandler('Failed to create facility', 500));
    }
  }

  // Fetch the facility
  const facility = await FacilitiesModel.getFacilityById(result.id);

  res.status(isCreated ? 201 : 200).json({
    success: true,
    message: isCreated ? 'Facility created successfully' : 'Facility updated successfully',
    data: formatFacilityResponse(facility.data),
    isCreated
  });
});

// ==================== EXPORT DEFAULT ====================
export default {
  createFacility,
  getAllFacilities,
  getFacilityById,
  getFacilityByPropertyId,
  updateFacility,
  updateFacilityByPropertyId,
  deleteFacility,
  hardDeleteFacility,
  deleteFacilityByPropertyId,
  restoreFacility,
  searchFacilities,
  getFacilityStatistics,
  bulkCreateFacilities,
  checkFacilityExists,
  createOrUpdateFacility
};