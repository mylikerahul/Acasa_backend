// models/facilities/facilities.model.js

import pool from '../../config/db.js';

// ==================== VALIDATION SCHEMAS ====================
const FURNISH_TYPES = ['unfurnished', 'semi_furnished', 'fully_furnished', 'luxury_furnished'];
const STATUS_TYPES = ['active', 'inactive', 'deleted'];

// ==================== FACILITIES MODEL ====================
class FacilityModel {
  // ==================== VALIDATION HELPERS ====================
  static validateFurnishType(type) {
    return FURNISH_TYPES.includes(type);
  }

  static validateStatus(status) {
    return STATUS_TYPES.includes(status);
  }

  static validateQuantity(qty) {
    return Number.isInteger(qty) && qty >= 0;
  }

  // ==================== SANITIZE DATA ====================
  static sanitizeData(data) {
    const sanitized = {};

    // Property ID (required)
    if (data.property_id !== undefined) {
      sanitized.property_id = parseInt(data.property_id);
    }

    // Type
    if (data.type !== undefined) {
      sanitized.type = data.type?.trim() || null;
    }

    // Kitchen facilities
    if (data.kitchen_open_plan !== undefined) sanitized.kitchen_open_plan = Boolean(data.kitchen_open_plan);
    if (data.kitchen_closed !== undefined) sanitized.kitchen_closed = Boolean(data.kitchen_closed);
    if (data.back_kitchen !== undefined) sanitized.back_kitchen = Boolean(data.back_kitchen);
    if (data.dry_pantry !== undefined) sanitized.dry_pantry = Boolean(data.dry_pantry);

    // Staff quarters
    if (data.maid_quarters !== undefined) sanitized.maid_quarters = Boolean(data.maid_quarters);
    if (data.maid_quarters_qty !== undefined) sanitized.maid_quarters_qty = parseInt(data.maid_quarters_qty) || 0;
    if (data.driver_quarters !== undefined) sanitized.driver_quarters = Boolean(data.driver_quarters);

    // Storage & Utility
    if (data.storage_room !== undefined) sanitized.storage_room = Boolean(data.storage_room);
    if (data.storage_room_qty !== undefined) sanitized.storage_room_qty = parseInt(data.storage_room_qty) || 0;
    if (data.laundry_room !== undefined) sanitized.laundry_room = Boolean(data.laundry_room);

    // Entertainment rooms
    if (data.study_room !== undefined) sanitized.study_room = Boolean(data.study_room);
    if (data.study_room_qty !== undefined) sanitized.study_room_qty = parseInt(data.study_room_qty) || 0;
    if (data.games_room !== undefined) sanitized.games_room = Boolean(data.games_room);
    if (data.library !== undefined) sanitized.library = Boolean(data.library);
    if (data.cinema_room !== undefined) sanitized.cinema_room = Boolean(data.cinema_room);

    // Additional spaces
    if (data.landing_area !== undefined) sanitized.landing_area = Boolean(data.landing_area);
    if (data.wine_cellar !== undefined) sanitized.wine_cellar = Boolean(data.wine_cellar);
    if (data.basement !== undefined) sanitized.basement = Boolean(data.basement);

    // Outdoor spaces
    if (data.terraces !== undefined) sanitized.terraces = Boolean(data.terraces);
    if (data.terraces_qty !== undefined) sanitized.terraces_qty = parseInt(data.terraces_qty) || 0;
    if (data.balconies !== undefined) sanitized.balconies = Boolean(data.balconies);
    if (data.balconies_qty !== undefined) sanitized.balconies_qty = parseInt(data.balconies_qty) || 0;

    // Furnishing
    if (data.furnished !== undefined) sanitized.furnished = Boolean(data.furnished);
    if (data.furnish_type !== undefined) {
      sanitized.furnish_type = this.validateFurnishType(data.furnish_type) 
        ? data.furnish_type 
        : 'unfurnished';
    }

    // Built-in storage
    if (data.built_in_wardrobes !== undefined) sanitized.built_in_wardrobes = Boolean(data.built_in_wardrobes);
    if (data.built_in_wardrobes_qty !== undefined) sanitized.built_in_wardrobes_qty = parseInt(data.built_in_wardrobes_qty) || 0;
    if (data.walk_in_closets !== undefined) sanitized.walk_in_closets = Boolean(data.walk_in_closets);
    if (data.walk_in_closets_qty !== undefined) sanitized.walk_in_closets_qty = parseInt(data.walk_in_closets_qty) || 0;

    // Technology & Finishes
    if (data.smart_home_technology !== undefined) sanitized.smart_home_technology = Boolean(data.smart_home_technology);
    if (data.equipped_kitchen !== undefined) sanitized.equipped_kitchen = Boolean(data.equipped_kitchen);
    if (data.kitchen_countertops_tile !== undefined) sanitized.kitchen_countertops_tile = data.kitchen_countertops_tile?.trim() || null;
    if (data.flooring_tile !== undefined) sanitized.flooring_tile = data.flooring_tile?.trim() || null;
    if (data.equipped_laundry !== undefined) sanitized.equipped_laundry = Boolean(data.equipped_laundry);

    // Services
    if (data.reception_service !== undefined) sanitized.reception_service = Boolean(data.reception_service);
    if (data.concierge_service !== undefined) sanitized.concierge_service = Boolean(data.concierge_service);
    if (data.valet_parking !== undefined) sanitized.valet_parking = Boolean(data.valet_parking);

    // Swimming Pool
    if (data.swimming_pool !== undefined) sanitized.swimming_pool = Boolean(data.swimming_pool);
    if (data.swimming_pool_private !== undefined) sanitized.swimming_pool_private = Boolean(data.swimming_pool_private);
    if (data.swimming_pool_communal !== undefined) sanitized.swimming_pool_communal = Boolean(data.swimming_pool_communal);
    if (data.swimming_pool_overflow !== undefined) sanitized.swimming_pool_overflow = Boolean(data.swimming_pool_overflow);
    if (data.swimming_pool_heated !== undefined) sanitized.swimming_pool_heated = Boolean(data.swimming_pool_heated);
    if (data.swimming_pool_infinity !== undefined) sanitized.swimming_pool_infinity = Boolean(data.swimming_pool_infinity);
    if (data.swimming_pool_cooled !== undefined) sanitized.swimming_pool_cooled = Boolean(data.swimming_pool_cooled);
    if (data.swimming_pool_standard !== undefined) sanitized.swimming_pool_standard = Boolean(data.swimming_pool_standard);
    if (data.swimming_pool_both !== undefined) sanitized.swimming_pool_both = Boolean(data.swimming_pool_both);
    if (data.swimming_pool_qty !== undefined) sanitized.swimming_pool_qty = parseInt(data.swimming_pool_qty) || 0;

    // Wellness
    if (data.jacuzzi !== undefined) sanitized.jacuzzi = Boolean(data.jacuzzi);
    if (data.jacuzzi_qty !== undefined) sanitized.jacuzzi_qty = parseInt(data.jacuzzi_qty) || 0;
    if (data.steam_room !== undefined) sanitized.steam_room = Boolean(data.steam_room);
    if (data.sauna !== undefined) sanitized.sauna = Boolean(data.sauna);

    // Fitness
    if (data.gymnasium !== undefined) sanitized.gymnasium = Boolean(data.gymnasium);
    if (data.gymnasium_private !== undefined) sanitized.gymnasium_private = Boolean(data.gymnasium_private);
    if (data.gymnasium_communal !== undefined) sanitized.gymnasium_communal = Boolean(data.gymnasium_communal);
    if (data.gymnasium_both !== undefined) sanitized.gymnasium_both = Boolean(data.gymnasium_both);

    // Sports
    if (data.tennis_court !== undefined) sanitized.tennis_court = Boolean(data.tennis_court);
    if (data.tennis_court_qty !== undefined) sanitized.tennis_court_qty = parseInt(data.tennis_court_qty) || 0;
    if (data.squash_court !== undefined) sanitized.squash_court = Boolean(data.squash_court);
    if (data.squash_court_qty !== undefined) sanitized.squash_court_qty = parseInt(data.squash_court_qty) || 0;
    if (data.basketball_court !== undefined) sanitized.basketball_court = Boolean(data.basketball_court);
    if (data.golf_course !== undefined) sanitized.golf_course = Boolean(data.golf_course);

    // Outdoor amenities
    if (data.bbq !== undefined) sanitized.bbq = Boolean(data.bbq);
    if (data.bbq_qty !== undefined) sanitized.bbq_qty = parseInt(data.bbq_qty) || 0;

    // Other facilities
    if (data.private_elevator !== undefined) sanitized.private_elevator = Boolean(data.private_elevator);
    if (data.private_elevator_qty !== undefined) sanitized.private_elevator_qty = parseInt(data.private_elevator_qty) || 0;
    if (data.child_play_area !== undefined) sanitized.child_play_area = Boolean(data.child_play_area);
    if (data.allocated_parking !== undefined) sanitized.allocated_parking = Boolean(data.allocated_parking);
    if (data.allocated_parking_qty !== undefined) sanitized.allocated_parking_qty = parseInt(data.allocated_parking_qty) || 0;

    // Additional amenities
    if (data.add_any_additional_amenities !== undefined) {
      sanitized.add_any_additional_amenities = data.add_any_additional_amenities?.trim() || null;
    }

    // Status
    if (data.status !== undefined) {
      sanitized.status = this.validateStatus(data.status) ? data.status : 'active';
    }

    return sanitized;
  }

  // ==================== CREATE ====================
  static async create(data) {
    try {
      if (!data.property_id) {
        throw new Error('Property ID is required');
      }

      const sanitized = this.sanitizeData(data);
      const fields = Object.keys(sanitized);
      const values = Object.values(sanitized);
      const placeholders = fields.map(() => '?').join(', ');

      const query = `
        INSERT INTO facilities (${fields.join(', ')})
        VALUES (${placeholders})
      `;

      const [result] = await pool.execute(query, values);

      if (result.affectedRows === 0) {
        throw new Error('Failed to create facility');
      }

      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Facility create error:', error);
      throw error;
    }
  }

  // ==================== FIND BY ID ====================
  static async findById(id) {
    try {
      const query = `
        SELECT f.*, 
               p.property_name,
               p.property_type,
               p.listing_type
        FROM facilities f
        LEFT JOIN properties p ON f.property_id = p.id
        WHERE f.id = ? AND f.status != 'deleted'
        LIMIT 1
      `;

      const [rows] = await pool.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Facility findById error:', error);
      throw error;
    }
  }

  // ==================== FIND BY PROPERTY ID ====================
  static async findByPropertyId(propertyId) {
    try {
      const query = `
        SELECT * FROM facilities
        WHERE property_id = ? AND status != 'deleted'
        LIMIT 1
      `;

      const [rows] = await pool.execute(query, [propertyId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Facility findByPropertyId error:', error);
      throw error;
    }
  }

  // ==================== GET ALL WITH FILTERS ====================
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT f.*, 
               p.property_name,
               p.property_type,
               p.listing_type
        FROM facilities f
        LEFT JOIN properties p ON f.property_id = p.id
        WHERE f.status != 'deleted'
      `;

      const params = [];

      // Filter by property_id
      if (filters.property_id) {
        query += ` AND f.property_id = ?`;
        params.push(filters.property_id);
      }

      // Filter by type
      if (filters.type) {
        query += ` AND f.type = ?`;
        params.push(filters.type);
      }

      // Filter by furnish_type
      if (filters.furnish_type) {
        query += ` AND f.furnish_type = ?`;
        params.push(filters.furnish_type);
      }

      // Filter by status
      if (filters.status) {
        query += ` AND f.status = ?`;
        params.push(filters.status);
      }

      // Filter by furnished
      if (filters.furnished !== undefined) {
        query += ` AND f.furnished = ?`;
        params.push(filters.furnished);
      }

      // Filter by swimming_pool
      if (filters.swimming_pool !== undefined) {
        query += ` AND f.swimming_pool = ?`;
        params.push(filters.swimming_pool);
      }

      // Filter by gymnasium
      if (filters.gymnasium !== undefined) {
        query += ` AND f.gymnasium = ?`;
        params.push(filters.gymnasium);
      }

      // Filter by smart_home_technology
      if (filters.smart_home_technology !== undefined) {
        query += ` AND f.smart_home_technology = ?`;
        params.push(filters.smart_home_technology);
      }

      // Sorting
      const sortBy = filters.sort_by || 'f.create_date';
      const sortOrder = filters.sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      query += ` ORDER BY ${sortBy} ${sortOrder}`;

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 50;
      const offset = (page - 1) * limit;

      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [rows] = await pool.execute(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM facilities f
        WHERE f.status != 'deleted'
      `;
      const countParams = [];

      if (filters.property_id) {
        countQuery += ` AND f.property_id = ?`;
        countParams.push(filters.property_id);
      }
      if (filters.type) {
        countQuery += ` AND f.type = ?`;
        countParams.push(filters.type);
      }
      if (filters.furnish_type) {
        countQuery += ` AND f.furnish_type = ?`;
        countParams.push(filters.furnish_type);
      }
      if (filters.status) {
        countQuery += ` AND f.status = ?`;
        countParams.push(filters.status);
      }

      const [countRows] = await pool.execute(countQuery, countParams);
      const total = countRows[0].total;

      return {
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Facility findAll error:', error);
      throw error;
    }
  }

  // ==================== UPDATE ====================
  static async update(id, data) {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Facility not found');
      }

      const sanitized = this.sanitizeData(data);
      
      // Remove property_id from update (shouldn't be changed)
      delete sanitized.property_id;

      if (Object.keys(sanitized).length === 0) {
        throw new Error('No valid fields to update');
      }

      const fields = Object.keys(sanitized).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(sanitized), id];

      const query = `
        UPDATE facilities
        SET ${fields}
        WHERE id = ?
      `;

      const [result] = await pool.execute(query, values);

      if (result.affectedRows === 0) {
        throw new Error('Failed to update facility');
      }

      return await this.findById(id);
    } catch (error) {
      console.error('Facility update error:', error);
      throw error;
    }
  }

  // ==================== SOFT DELETE ====================
  static async softDelete(id) {
    try {
      const query = `
        UPDATE facilities
        SET status = 'deleted'
        WHERE id = ?
      `;

      const [result] = await pool.execute(query, [id]);

      if (result.affectedRows === 0) {
        throw new Error('Facility not found');
      }

      return { success: true, message: 'Facility deleted successfully' };
    } catch (error) {
      console.error('Facility softDelete error:', error);
      throw error;
    }
  }

  // ==================== HARD DELETE ====================
  static async delete(id) {
    try {
      const query = `DELETE FROM facilities WHERE id = ?`;
      const [result] = await pool.execute(query, [id]);

      if (result.affectedRows === 0) {
        throw new Error('Facility not found');
      }

      return { success: true, message: 'Facility permanently deleted' };
    } catch (error) {
      console.error('Facility delete error:', error);
      throw error;
    }
  }

  // ==================== DELETE BY PROPERTY ID ====================
  static async deleteByPropertyId(propertyId) {
    try {
      const query = `DELETE FROM facilities WHERE property_id = ?`;
      const [result] = await pool.execute(query, [propertyId]);

      return { 
        success: true, 
        message: 'Facilities deleted successfully',
        deleted_count: result.affectedRows 
      };
    } catch (error) {
      console.error('Facility deleteByPropertyId error:', error);
      throw error;
    }
  }

  // ==================== UPDATE STATUS ====================
  static async updateStatus(id, status) {
    try {
      if (!this.validateStatus(status)) {
        throw new Error('Invalid status');
      }

      const query = `
        UPDATE facilities
        SET status = ?
        WHERE id = ?
      `;

      const [result] = await pool.execute(query, [status, id]);

      if (result.affectedRows === 0) {
        throw new Error('Facility not found');
      }

      return await this.findById(id);
    } catch (error) {
      console.error('Facility updateStatus error:', error);
      throw error;
    }
  }

  // ==================== GET STATS ====================
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
          SUM(CASE WHEN furnished = 1 THEN 1 ELSE 0 END) as furnished,
          SUM(CASE WHEN swimming_pool = 1 THEN 1 ELSE 0 END) as with_pool,
          SUM(CASE WHEN gymnasium = 1 THEN 1 ELSE 0 END) as with_gym,
          SUM(CASE WHEN smart_home_technology = 1 THEN 1 ELSE 0 END) as smart_homes,
          SUM(CASE WHEN private_elevator = 1 THEN 1 ELSE 0 END) as with_elevator,
          SUM(CASE WHEN maid_quarters = 1 THEN 1 ELSE 0 END) as with_maid_quarters
        FROM facilities
        WHERE status != 'deleted'
      `;

      const [rows] = await pool.execute(query);
      return rows[0];
    } catch (error) {
      console.error('Facility getStats error:', error);
      throw error;
    }
  }

  // ==================== GET FURNISH TYPE STATS ====================
  static async getFurnishTypeStats() {
    try {
      const query = `
        SELECT 
          furnish_type,
          COUNT(*) as count
        FROM facilities
        WHERE status != 'deleted'
        GROUP BY furnish_type
        ORDER BY count DESC
      `;

      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      console.error('Facility getFurnishTypeStats error:', error);
      throw error;
    }
  }

  // ==================== CHECK EXISTS ====================
  static async exists(id) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM facilities
        WHERE id = ? AND status != 'deleted'
      `;

      const [rows] = await pool.execute(query, [id]);
      return rows[0].count > 0;
    } catch (error) {
      console.error('Facility exists error:', error);
      throw error;
    }
  }

  // ==================== CHECK EXISTS BY PROPERTY ====================
  static async existsByProperty(propertyId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM facilities
        WHERE property_id = ? AND status != 'deleted'
      `;

      const [rows] = await pool.execute(query, [propertyId]);
      return rows[0].count > 0;
    } catch (error) {
      console.error('Facility existsByProperty error:', error);
      throw error;
    }
  }

  // ==================== BULK CREATE ====================
  static async bulkCreate(facilities) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const created = [];
      for (const facility of facilities) {
        const sanitized = this.sanitizeData(facility);
        const fields = Object.keys(sanitized);
        const values = Object.values(sanitized);
        const placeholders = fields.map(() => '?').join(', ');

        const query = `
          INSERT INTO facilities (${fields.join(', ')})
          VALUES (${placeholders})
        `;

        const [result] = await connection.execute(query, values);
        created.push(result.insertId);
      }

      await connection.commit();

      return {
        success: true,
        created_count: created.length,
        ids: created,
      };
    } catch (error) {
      await connection.rollback();
      console.error('Facility bulkCreate error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // ==================== BULK UPDATE STATUS ====================
  static async bulkUpdateStatus(ids, status) {
    try {
      if (!this.validateStatus(status)) {
        throw new Error('Invalid status');
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('Invalid ids array');
      }

      const placeholders = ids.map(() => '?').join(',');
      const query = `
        UPDATE facilities
        SET status = ?
        WHERE id IN (${placeholders})
      `;

      const [result] = await pool.execute(query, [status, ...ids]);

      return {
        success: true,
        updated_count: result.affectedRows,
      };
    } catch (error) {
      console.error('Facility bulkUpdateStatus error:', error);
      throw error;
    }
  }

  // ==================== BULK DELETE ====================
  static async bulkDelete(ids) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('Invalid ids array');
      }

      const placeholders = ids.map(() => '?').join(',');
      const query = `DELETE FROM facilities WHERE id IN (${placeholders})`;

      const [result] = await pool.execute(query, ids);

      return {
        success: true,
        deleted_count: result.affectedRows,
      };
    } catch (error) {
      console.error('Facility bulkDelete error:', error);
      throw error;
    }
  }

  // ==================== SEARCH ====================
  static async search(searchTerm) {
    try {
      const query = `
        SELECT f.*, 
               p.property_name,
               p.property_type,
               p.listing_type
        FROM facilities f
        LEFT JOIN properties p ON f.property_id = p.id
        WHERE f.status != 'deleted'
        AND (
          f.type LIKE ? OR
          f.kitchen_countertops_tile LIKE ? OR
          f.flooring_tile LIKE ? OR
          f.add_any_additional_amenities LIKE ? OR
          p.property_name LIKE ?
        )
        ORDER BY f.create_date DESC
        LIMIT 50
      `;

      const searchPattern = `%${searchTerm}%`;
      const [rows] = await pool.execute(query, [
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      ]);

      return rows;
    } catch (error) {
      console.error('Facility search error:', error);
      throw error;
    }
  }

  // ==================== GET LUXURY FACILITIES ====================
  static async getLuxuryFacilities() {
    try {
      const query = `
        SELECT f.*, 
               p.property_name,
               p.property_type,
               p.listing_type
        FROM facilities f
        LEFT JOIN properties p ON f.property_id = p.id
        WHERE f.status = 'active'
        AND (
          f.swimming_pool = 1 OR
          f.gymnasium = 1 OR
          f.tennis_court = 1 OR
          f.cinema_room = 1 OR
          f.wine_cellar = 1 OR
          f.smart_home_technology = 1 OR
          f.private_elevator = 1 OR
          f.furnish_type = 'luxury_furnished'
        )
        ORDER BY f.create_date DESC
        LIMIT 100
      `;

      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      console.error('Facility getLuxuryFacilities error:', error);
      throw error;
    }
  }

  // ==================== GET FACILITIES WITH POOLS ====================
  static async getWithPools() {
    try {
      const query = `
        SELECT f.*, 
               p.property_name,
               p.property_type,
               p.listing_type
        FROM facilities f
        LEFT JOIN properties p ON f.property_id = p.id
        WHERE f.status = 'active'
        AND f.swimming_pool = 1
        ORDER BY f.swimming_pool_qty DESC, f.create_date DESC
      `;

      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      console.error('Facility getWithPools error:', error);
      throw error;
    }
  }

  // ==================== GET FACILITIES SUMMARY ====================
  static async getSummary(propertyId) {
    try {
      const facility = await this.findByPropertyId(propertyId);
      if (!facility) {
        return null;
      }

      const summary = {
        id: facility.id,
        property_id: facility.property_id,
        furnished: facility.furnished,
        furnish_type: facility.furnish_type,
        
        // Key features
        key_features: [],
        
        // Counts
        total_rooms: 0,
        total_facilities: 0,
      };

      // Build key features array
      if (facility.swimming_pool) {
        summary.key_features.push({
          name: 'Swimming Pool',
          type: facility.swimming_pool_private ? 'Private' : 
                facility.swimming_pool_communal ? 'Communal' : 'Standard',
          qty: facility.swimming_pool_qty,
        });
      }

      if (facility.gymnasium) {
        summary.key_features.push({
          name: 'Gymnasium',
          type: facility.gymnasium_private ? 'Private' : 
                facility.gymnasium_communal ? 'Communal' : 'Standard',
        });
      }

      if (facility.parking) {
        summary.key_features.push({
          name: 'Parking',
          qty: facility.allocated_parking_qty,
        });
      }

      if (facility.maid_quarters) {
        summary.key_features.push({
          name: 'Maid Quarters',
          qty: facility.maid_quarters_qty,
        });
        summary.total_rooms += facility.maid_quarters_qty;
      }

      if (facility.study_room) {
        summary.key_features.push({
          name: 'Study Room',
          qty: facility.study_room_qty,
        });
        summary.total_rooms += facility.study_room_qty;
      }

      // Count total facilities
      const facilityFields = [
        'swimming_pool', 'gymnasium', 'tennis_court', 'squash_court',
        'basketball_court', 'golf_course', 'jacuzzi', 'steam_room',
        'sauna', 'cinema_room', 'games_room', 'library', 'wine_cellar',
        'smart_home_technology', 'private_elevator'
      ];

      summary.total_facilities = facilityFields.reduce((count, field) => {
        return count + (facility[field] ? 1 : 0);
      }, 0);

      return summary;
    } catch (error) {
      console.error('Facility getSummary error:', error);
      throw error;
    }
  }
}

export default FacilityModel;