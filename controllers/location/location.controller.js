// controllers/location/location.controller.js

import * as LocationModel from '../../models/location/location.model.js';
import * as UserModel from '../../models/user/user.model.js';
import catchAsyncErrors from '../../middleware/catchAsyncErrors.js';
import ErrorHandler from '../../utils/errorHandler.js';
import pool from '../../config/db.js';

/* =========================================================
   GUEST - GET LOCATION INFO (No Save)
========================================================= */
export const getLocationInfo = catchAsyncErrors(async (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return next(new ErrorHandler('Latitude and Longitude are required', 400));
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return next(new ErrorHandler('Invalid coordinates', 400));
  }

  try {
    // Reverse geocoding using free API (Nominatim)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'YourAppName/1.0' // Required by Nominatim
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding API failed');
    }

    const data = await response.json();
    const address = data.address || {};

    const locationInfo = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      formatted_address: data.display_name || null,
      address: {
        house_number: address.house_number || null,
        road: address.road || null,
        neighbourhood: address.neighbourhood || address.suburb || null,
        city: address.city || address.town || address.village || null,
        state: address.state || null,
        country: address.country || null,
        pincode: address.postcode || null,
      },
      // For display
      display: {
        short: address.suburb || address.neighbourhood || address.city || 'Unknown',
        medium: `${address.suburb || address.neighbourhood || ''}, ${address.city || ''}`.trim().replace(/^,|,$/g, ''),
        full: data.display_name || 'Unknown Location'
      }
    };

    res.status(200).json({
      success: true,
      message: 'Location info fetched successfully',
      location: locationInfo,
      saved: false // Guest user - not saved
    });

  } catch (error) {
    console.error('Geocoding Error:', error);
    
    // Return basic info if geocoding fails
    res.status(200).json({
      success: true,
      message: 'Location coordinates received (geocoding unavailable)',
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        formatted_address: null,
        display: {
          short: `${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}`,
          medium: `Lat: ${latitude}, Lng: ${longitude}`,
          full: `Coordinates: ${latitude}, ${longitude}`
        }
      },
      saved: false
    });
  }
});

/* =========================================================
   LOGGED USER - SAVE LOCATION
========================================================= */
export const saveLocation = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const { latitude, longitude, location_type = 'current' } = req.body;

  if (!latitude || !longitude) {
    return next(new ErrorHandler('Latitude and Longitude are required', 400));
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return next(new ErrorHandler('Invalid coordinates', 400));
  }

  try {
    // Reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'YourAppName/1.0'
        }
      }
    );

    let locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: null,
      city: null,
      state: null,
      country: null,
      pincode: null,
      location_type,
      is_primary: true
    };

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};

      locationData = {
        ...locationData,
        address: data.display_name || null,
        city: addr.city || addr.town || addr.village || null,
        state: addr.state || null,
        country: addr.country || null,
        pincode: addr.postcode || null,
      };
    }

    // Save to user_locations table
    const savedLocation = await LocationModel.saveUserLocation(userId, locationData);

    // Also update main location in users table using UserModel
    const shortAddress = locationData.city 
      ? `${locationData.city}${locationData.state ? ', ' + locationData.state : ''}${locationData.country ? ', ' + locationData.country : ''}`
      : locationData.address?.substring(0, 100) || `${latitude}, ${longitude}`;
    
    await UserModel.updateUserLocation(userId, {
      location: shortAddress
    });

    res.status(200).json({
      success: true,
      message: 'Location saved successfully',
      location: savedLocation,
      saved: true
    });

  } catch (error) {
    console.error('Save Location Error:', error);
    return next(new ErrorHandler('Failed to save location', 500));
  }
});

/* =========================================================
   GET MY LOCATIONS
========================================================= */
export const getMyLocations = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  const locations = await LocationModel.getUserLocations(userId);
  const primaryLocation = locations.find(loc => loc.is_primary) || null;

  res.status(200).json({
    success: true,
    count: locations.length,
    primaryLocation,
    locations
  });
});

/* =========================================================
   GET MY PRIMARY LOCATION
========================================================= */
export const getMyPrimaryLocation = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  const location = await LocationModel.getUserPrimaryLocation(userId);

  if (!location) {
    return res.status(200).json({
      success: true,
      message: 'No primary location set',
      location: null
    });
  }

  res.status(200).json({
    success: true,
    location
  });
});

/* =========================================================
   DELETE LOCATION
========================================================= */
export const deleteLocation = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const { locationId } = req.params;

  const deleted = await LocationModel.deleteUserLocation(userId, locationId);

  if (!deleted) {
    return next(new ErrorHandler('Location not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Location deleted successfully'
  });
});

/* =========================================================
   UPDATE LOCATION TYPE (Home, Work, etc.)
========================================================= */
export const updateLocationType = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const { locationId } = req.params;
  const { location_type, is_primary } = req.body;

  // Verify location belongs to user
  const locations = await LocationModel.getUserLocations(userId);
  const locationExists = locations.find(loc => loc.id === parseInt(locationId));

  if (!locationExists) {
    return next(new ErrorHandler('Location not found', 404));
  }

  // Update using raw query for simplicity
  let updateFields = [];
  let values = [];
  let idx = 1;

  if (location_type) {
    updateFields.push(`location_type = $${idx}`);
    values.push(location_type);
    idx++;
  }

  if (typeof is_primary === 'boolean') {
    if (is_primary) {
      // Unset other primaries first
      await pool.query(
        `UPDATE user_locations SET is_primary = false WHERE user_id = $1`,
        [userId]
      );
      
      // Update main user location when setting as primary
      const newPrimaryLocation = locationExists;
      const shortAddress = newPrimaryLocation.city 
        ? `${newPrimaryLocation.city}${newPrimaryLocation.state ? ', ' + newPrimaryLocation.state : ''}${newPrimaryLocation.country ? ', ' + newPrimaryLocation.country : ''}`
        : newPrimaryLocation.address?.substring(0, 100) || `${newPrimaryLocation.latitude}, ${newPrimaryLocation.longitude}`;
      
      await UserModel.updateUserLocation(userId, {
        location: shortAddress
      });
    }
    updateFields.push(`is_primary = $${idx}`);
    values.push(is_primary);
    idx++;
  }

  if (updateFields.length === 0) {
    return next(new ErrorHandler('No fields to update', 400));
  }

  values.push(locationId);
  
  const query = `
    UPDATE user_locations 
    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${idx}
    RETURNING *;
  `;

  const { rows } = await pool.query(query, values);

  res.status(200).json({
    success: true,
    message: 'Location updated successfully',
    location: rows[0]
  });
});