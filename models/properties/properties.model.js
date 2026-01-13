import pool from '../../config/db.js';

// ==================== TABLE CREATION FOR ALL TABLES ====================

// Main Properties Table
export const createPropertyTables = async () => {
  const tables = [
    // Properties table
    `
    CREATE TABLE IF NOT EXISTS properties (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      p_id VARCHAR(255),
      project_id INT(11),
      listing_type VARCHAR(60),
      occupancy VARCHAR(60),
      qc VARCHAR(10),
      dld_permit VARCHAR(255),
      views VARCHAR(255),
      bathrooms VARCHAR(255),
      title_deep VARCHAR(100),
      Spa_number VARCHAR(50),
      from_duration VARCHAR(20),
      to_duration VARCHAR(20),
      availability_type VARCHAR(20),
      RefNumber VARCHAR(191),
      user_id INT(11),
      developer INT(11),
      featured_property VARCHAR(255),
      property_name VARCHAR(191),
      keyword TEXT,
      seo_title TEXT,
      meta_description TEXT,
      canonical_tags VARCHAR(255),
      property_slug VARCHAR(191) UNIQUE,
      property_type VARCHAR(255),
      location VARCHAR(191),
      property_purpose VARCHAR(191),
      address TEXT,
      map_latitude VARCHAR(191),
      map_longitude VARCHAR(191),
      pincode VARCHAR(191),
      landmark VARCHAR(191),
      country VARCHAR(255),
      state_id INT(11),
      city_id INT(11),
      community_id INT(11),
      sub_community_id INT(11),
      agent_id INT(11),
      building VARCHAR(255),
      description LONGTEXT,
      property_features TEXT,
      featured_image VARCHAR(191),
      floor_media_ids VARCHAR(255),
      gallery_media_ids VARCHAR(255),
      developer_id INT(11),
      video_url VARCHAR(255),
      whatsapp_url VARCHAR(255),
      flooring VARCHAR(191),
      furnishing VARCHAR(191),
      video_code TEXT,
      price INT(11),
      price_end VARCHAR(200),
      askprice VARCHAR(10),
      currency_id INT(11),
      bedroom VARCHAR(255),
      kitchen_room INT(11),
      guest_room INT(11),
      other_room INT(11),
      total_room VARCHAR(100),
      floor_no INT(11),
      lift INT(11),
      max_area VARCHAR(255),
      min_area VARCHAR(255),
      area INT(11),
      area_end VARCHAR(200),
      area_size VARCHAR(100),
      amenities VARCHAR(191),
      parking VARCHAR(255),
      property_status VARCHAR(255),
      ReraNumber VARCHAR(191),
      unit VARCHAR(255),
      complete_date TIMESTAMP NULL,
      listing_agent_id INT(11),
      modify_by_admin INT(11) DEFAULT 0,
      identifying_channel VARCHAR(100),
      marketing_channel VARCHAR(100),
      contact_channel VARCHAR(100),
      owner_id INT(11),
      owner_developer_id VARCHAR(255),
      owner_agreement VARCHAR(100),
      owner_commision VARCHAR(100),
      owner_creation_date DATE,
      owner_listing_date DATE,
      exclusive_status VARCHAR(100),
      completion_date VARCHAR(20),
      vacating_date VARCHAR(60),
      documents_id VARCHAR(255),
      status INT(11) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      more_filter VARCHAR(255),
      property_locations VARCHAR(255),
      INDEX idx_property_slug (property_slug),
      INDEX idx_user_id (user_id),
      INDEX idx_developer_id (developer_id),
      INDEX idx_city_id (city_id),
      INDEX idx_status (status),
      INDEX idx_featured (featured_property),
      INDEX idx_price (price),
      INDEX idx_listing_type (listing_type),
      INDEX idx_property_type (property_type),
      INDEX idx_property_purpose (property_purpose),
      INDEX idx_bedroom (bedroom),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,

    // Property Types table
    `
    CREATE TABLE IF NOT EXISTS property_types (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      types VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      property_for VARCHAR(100),
      heading VARCHAR(255),
      descriptions TEXT,
      imageurl VARCHAR(500),
      status INT(11) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_slug (slug),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,

    // Property Locations table
    `
    CREATE TABLE IF NOT EXISTS property_locations (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      property_id INT(10) UNSIGNED NOT NULL,
      type VARCHAR(100),
      construction VARCHAR(100),
      occupancy VARCHAR(100),
      country_id INT(11),
      state_id INT(11),
      city_id INT(11),
      community_id INT(11),
      sub_community_id INT(11),
      available_from DATE,
      available_apartment VARCHAR(255),
      address TEXT,
      ownPlaces VARCHAR(255),
      latitude VARCHAR(100),
      longitude VARCHAR(100),
      unit_number VARCHAR(50),
      floor_number VARCHAR(50),
      lifestyle_id INT(11),
      apartment VARCHAR(255),
      villa VARCHAR(255),
      user_commercial VARCHAR(255),
      land VARCHAR(255),
      residential VARCHAR(255),
      commercial VARCHAR(255),
      healthcare VARCHAR(255),
      educational VARCHAR(255),
      hotel_leisure VARCHAR(255),
      industrial VARCHAR(255),
      alternative_investment VARCHAR(255),
      status INT(11) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      INDEX idx_property_id (property_id),
      INDEX idx_city_id (city_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,

    // Property List Type table
    `
    CREATE TABLE IF NOT EXISTS property_list_type (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,

    // Property Gallery table
    `
    CREATE TABLE IF NOT EXISTS property_gallery (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      property_id INT(10) UNSIGNED NOT NULL,
      image_name VARCHAR(500) NOT NULL,
      added_by INT(11),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      INDEX idx_property_id (property_id),
      INDEX idx_added_by (added_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,

    // Property Age table
    `
    CREATE TABLE IF NOT EXISTS propertyage (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      status INT(11) DEFAULT 1,
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,

    // Properties Sub Type table
    `
    CREATE TABLE IF NOT EXISTS properties_sub_type (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,

    // Properties Prices table
    `
    CREATE TABLE IF NOT EXISTS properties_prices (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      property_id INT(10) UNSIGNED NOT NULL,
      type VARCHAR(100),
      number_of_cheques INT(11),
      diposit_amount DECIMAL(15,2),
      agency_fee DECIMAL(15,2),
      rental_per_year DECIMAL(15,2),
      viewing_time VARCHAR(100),
      viewing_possible_rental VARCHAR(10),
      viewing_possible_sale VARCHAR(10),
      rental_price DECIMAL(15,2),
      sale_price DECIMAL(15,2),
      listing_price DECIMAL(15,2),
      currency_id INT(11),
      rental_period VARCHAR(100),
      price_on_application VARCHAR(10),
      commision_from_landlord DECIMAL(10,2),
      payment_plan_ids TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      INDEX idx_property_id (property_id),
      INDEX idx_type (type),
      INDEX idx_currency_id (currency_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,

    // Properties Metadata table
    `
    CREATE TABLE IF NOT EXISTS properties_metadata (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      property_id INT(10) UNSIGNED NOT NULL,
      completion_date DATE,
      completion_status VARCHAR(100),
      construction_completion_date DATE,
      devloper_description TEXT,
      meta_developer VARCHAR(255),
      developer_name VARCHAR(255),
      developers_details TEXT,
      display_address TEXT,
      exclusive VARCHAR(10),
      floor_type VARCHAR(100),
      furnished VARCHAR(100),
      mandate TEXT,
      construction_type VARCHAR(100),
      ownership_type VARCHAR(100),
      owner_type VARCHAR(100),
      property_sub_type VARCHAR(100),
      property_type VARCHAR(100),
      rera_permit_number VARCHAR(255),
      unit_level VARCHAR(50),
      unit_no VARCHAR(50),
      video_link VARCHAR(500),
      year_built YEAR,
      zipcode VARCHAR(20),
      avalabilty_status VARCHAR(100),
      meta_title VARCHAR(255),
      meta_keywords TEXT,
      meta_description TEXT,
      measurment VARCHAR(100),
      size DECIMAL(10,2),
      internal_notes TEXT,
      starting_price DECIMAL(15,2),
      no_of_bhk VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      INDEX idx_property_id (property_id),
      INDEX idx_completion_status (completion_status),
      INDEX idx_property_type (property_type),
      INDEX idx_availability_status (avalabilty_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,

    // Saved Property table
    `
    CREATE TABLE IF NOT EXISTS saved_property (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT(11) NOT NULL,
      property_id INT(10) UNSIGNED NOT NULL,
      type VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_property (user_id, property_id),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_property_id (property_id),
      INDEX idx_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  ];

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    for (const query of tables) {
      await connection.query(query);
    }
    
    await connection.commit();
    
    return { success: true, message: 'All property tables created successfully' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ==================== MAIN PROPERTY OPERATIONS ====================

export const createProperty = async (propertyData, relatedData = {}) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Validate required fields
    if (!propertyData.property_name || !propertyData.property_slug) {
      throw new Error('Property name and slug are required fields');
    }

    // Check if slug already exists
    const [existingSlug] = await connection.query(
      'SELECT id FROM properties WHERE property_slug = ?',
      [propertyData.property_slug]
    );

    if (existingSlug.length > 0) {
      throw new Error('Property with this slug already exists');
    }

    // Insert main property data
    const propertyFields = Object.keys(propertyData);
    const propertyValues = Object.values(propertyData);
    const propertyPlaceholders = propertyFields.map(() => '?').join(', ');
    
    const propertyQuery = `
      INSERT INTO properties (${propertyFields.join(', ')})
      VALUES (${propertyPlaceholders})
    `;

    const [propertyResult] = await connection.query(propertyQuery, propertyValues);
    const propertyId = propertyResult.insertId;

    // Insert related data if provided
    const insertedRelated = {};

    // Insert property locations
    if (relatedData.locations && Array.isArray(relatedData.locations)) {
      const locationInserts = [];
      for (const location of relatedData.locations) {
        const locationData = { property_id: propertyId, ...location };
        const locationFields = Object.keys(locationData);
        const locationValues = Object.values(locationData);
        const locationPlaceholders = locationFields.map(() => '?').join(', ');
        
        const locationQuery = `
          INSERT INTO property_locations (${locationFields.join(', ')})
          VALUES (${locationPlaceholders})
        `;
        
        const [locationResult] = await connection.query(locationQuery, locationValues);
        locationInserts.push(locationResult.insertId);
      }
      insertedRelated.locations = locationInserts;
    }

    // Insert property prices
    if (relatedData.prices) {
      const priceData = { property_id: propertyId, ...relatedData.prices };
      const priceFields = Object.keys(priceData);
      const priceValues = Object.values(priceData);
      const pricePlaceholders = priceFields.map(() => '?').join(', ');
      
      const priceQuery = `
        INSERT INTO properties_prices (${priceFields.join(', ')})
        VALUES (${pricePlaceholders})
      `;
      
      const [priceResult] = await connection.query(priceQuery, priceValues);
      insertedRelated.prices = priceResult.insertId;
    }

    // Insert property metadata
    if (relatedData.metadata) {
      const metadata = { property_id: propertyId, ...relatedData.metadata };
      const metaFields = Object.keys(metadata);
      const metaValues = Object.values(metadata);
      const metaPlaceholders = metaFields.map(() => '?').join(', ');
      
      const metaQuery = `
        INSERT INTO properties_metadata (${metaFields.join(', ')})
        VALUES (${metaPlaceholders})
      `;
      
      const [metaResult] = await connection.query(metaQuery, metaValues);
      insertedRelated.metadata = metaResult.insertId;
    }

    // Insert gallery images
    if (relatedData.gallery && Array.isArray(relatedData.gallery)) {
      const galleryInserts = [];
      for (const image of relatedData.gallery) {
        const galleryData = { 
          property_id: propertyId, 
          image_name: image.image_name,
          added_by: image.added_by || propertyData.user_id
        };
        
        const galleryQuery = `
          INSERT INTO property_gallery (property_id, image_name, added_by)
          VALUES (?, ?, ?)
        `;
        
        const [galleryResult] = await connection.query(galleryQuery, [
          galleryData.property_id,
          galleryData.image_name,
          galleryData.added_by
        ]);
        galleryInserts.push(galleryResult.insertId);
      }
      insertedRelated.gallery = galleryInserts;
    }

    await connection.commit();

    return {
      success: true,
      message: 'Property created successfully',
      propertyId,
      relatedIds: insertedRelated,
      data: { id: propertyId, ...propertyData }
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateProperty = async (id, updateData, relatedUpdates = {}) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Check if property exists
    const [existing] = await connection.query(
      'SELECT id, property_slug FROM properties WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new Error(`Property with ID ${id} not found`);
    }

    // If slug is being updated, check for duplicates
    if (updateData.property_slug && updateData.property_slug !== existing[0].property_slug) {
      const [slugCheck] = await connection.query(
        'SELECT id FROM properties WHERE property_slug = ? AND id != ?',
        [updateData.property_slug, id]
      );

      if (slugCheck.length > 0) {
        throw new Error('Property with this slug already exists');
      }
    }

    // Update main property data if provided
    let propertyUpdateResult = null;
    if (Object.keys(updateData).length > 0) {
      const disallowedFields = ['id', 'created_at'];
      disallowedFields.forEach(field => delete updateData[field]);

      const fields = Object.keys(updateData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = [...Object.values(updateData), id];

      const query = `
        UPDATE properties 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const [result] = await connection.query(query, values);
      propertyUpdateResult = result.affectedRows;
    }

    // Update related data if provided
    const updatedRelated = {};

    // Update or insert property locations
    if (relatedUpdates.locations) {
      // Delete existing locations and insert new ones
      await connection.query('DELETE FROM property_locations WHERE property_id = ?', [id]);
      
      if (Array.isArray(relatedUpdates.locations) && relatedUpdates.locations.length > 0) {
        const locationInserts = [];
        for (const location of relatedUpdates.locations) {
          const locationData = { property_id: id, ...location };
          const locationFields = Object.keys(locationData);
          const locationValues = Object.values(locationData);
          const locationPlaceholders = locationFields.map(() => '?').join(', ');
          
          const locationQuery = `
            INSERT INTO property_locations (${locationFields.join(', ')})
            VALUES (${locationPlaceholders})
          `;
          
          const [locationResult] = await connection.query(locationQuery, locationValues);
          locationInserts.push(locationResult.insertId);
        }
        updatedRelated.locations = locationInserts;
      }
    }

    // Update property prices
    if (relatedUpdates.prices) {
      // Check if price record exists
      const [existingPrice] = await connection.query(
        'SELECT id FROM properties_prices WHERE property_id = ?',
        [id]
      );

      if (existingPrice.length > 0) {
        // Update existing
        const priceFields = Object.keys(relatedUpdates.prices);
        const priceSetClause = priceFields.map(field => `${field} = ?`).join(', ');
        const priceValues = [...Object.values(relatedUpdates.prices), id];
        
        const priceQuery = `
          UPDATE properties_prices 
          SET ${priceSetClause}, updated_at = CURRENT_TIMESTAMP
          WHERE property_id = ?
        `;
        
        await connection.query(priceQuery, priceValues);
        updatedRelated.prices = existingPrice[0].id;
      } else {
        // Insert new
        const priceData = { property_id: id, ...relatedUpdates.prices };
        const priceFields = Object.keys(priceData);
        const priceValues = Object.values(priceData);
        const pricePlaceholders = priceFields.map(() => '?').join(', ');
        
        const priceQuery = `
          INSERT INTO properties_prices (${priceFields.join(', ')})
          VALUES (${pricePlaceholders})
        `;
        
        const [priceResult] = await connection.query(priceQuery, priceValues);
        updatedRelated.prices = priceResult.insertId;
      }
    }

    // Update property metadata
    if (relatedUpdates.metadata) {
      // Check if metadata record exists
      const [existingMeta] = await connection.query(
        'SELECT id FROM properties_metadata WHERE property_id = ?',
        [id]
      );

      if (existingMeta.length > 0) {
        // Update existing
        const metaFields = Object.keys(relatedUpdates.metadata);
        const metaSetClause = metaFields.map(field => `${field} = ?`).join(', ');
        const metaValues = [...Object.values(relatedUpdates.metadata), id];
        
        const metaQuery = `
          UPDATE properties_metadata 
          SET ${metaSetClause}, updated_at = CURRENT_TIMESTAMP
          WHERE property_id = ?
        `;
        
        await connection.query(metaQuery, metaValues);
        updatedRelated.metadata = existingMeta[0].id;
      } else {
        // Insert new
        const metaData = { property_id: id, ...relatedUpdates.metadata };
        const metaFields = Object.keys(metaData);
        const metaValues = Object.values(metaData);
        const metaPlaceholders = metaFields.map(() => '?').join(', ');
        
        const metaQuery = `
          INSERT INTO properties_metadata (${metaFields.join(', ')})
          VALUES (${metaPlaceholders})
        `;
        
        const [metaResult] = await connection.query(metaQuery, metaValues);
        updatedRelated.metadata = metaResult.insertId;
      }
    }

    // Update gallery images
    if (relatedUpdates.gallery !== undefined) {
      if (Array.isArray(relatedUpdates.gallery)) {
        // Delete existing gallery and insert new
        await connection.query('DELETE FROM property_gallery WHERE property_id = ?', [id]);
        
        if (relatedUpdates.gallery.length > 0) {
          const galleryInserts = [];
          for (const image of relatedUpdates.gallery) {
            const galleryData = { 
              property_id: id, 
              image_name: image.image_name,
              added_by: image.added_by || updateData.user_id
            };
            
            const galleryQuery = `
              INSERT INTO property_gallery (property_id, image_name, added_by)
              VALUES (?, ?, ?)
            `;
            
            const [galleryResult] = await connection.query(galleryQuery, [
              galleryData.property_id,
              galleryData.image_name,
              galleryData.added_by
            ]);
            galleryInserts.push(galleryResult.insertId);
          }
          updatedRelated.gallery = galleryInserts;
        }
      }
    }

    await connection.commit();

    // Fetch updated property with all related data
    const [updatedProperty] = await connection.query('SELECT * FROM properties WHERE id = ?', [id]);

    return {
      success: true,
      message: 'Property updated successfully',
      propertyId: id,
      mainUpdated: propertyUpdateResult,
      relatedUpdated: updatedRelated,
      data: updatedProperty[0]
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteProperty = async (id, hardDelete = false) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Check if property exists
    const [existing] = await connection.query(
      'SELECT id, property_name, status FROM properties WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new Error(`Property with ID ${id} not found`);
    }

    let result;
    let message;

    if (hardDelete) {
      // Cascade delete will handle related tables due to foreign keys
      const query = 'DELETE FROM properties WHERE id = ?';
      [result] = await connection.query(query, [id]);
      message = 'Property and all related data permanently deleted';
    } else {
      // Soft delete - update status to 0
      const query = 'UPDATE properties SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      [result] = await connection.query(query, [id]);
      message = 'Property soft deleted (status set to 0)';
    }

    await connection.commit();

    if (result.affectedRows === 0) {
      throw new Error('Property deletion failed');
    }

    return {
      success: true,
      message,
      propertyId: id,
      propertyName: existing[0].property_name,
      deleteType: hardDelete ? 'hard' : 'soft',
      affectedRows: result.affectedRows
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ==================== PROPERTY FETCH OPERATIONS ====================

export const getPropertyById = async (id) => {
  try {
    // Get main property data
    const [propertyRows] = await pool.query(
      'SELECT * FROM properties WHERE id = ? AND status = 1',
      [id]
    );
    
    if (propertyRows.length === 0) {
      return {
        success: false,
        message: `Property with ID ${id} not found`,
        data: null
      };
    }

    const property = propertyRows[0];

    // Fetch all related data in parallel
    const [
      locations,
      prices,
      metadata,
      gallery,
      savedCount
    ] = await Promise.all([
      pool.query('SELECT * FROM property_locations WHERE property_id = ? AND status = 1', [id]),
      pool.query('SELECT * FROM properties_prices WHERE property_id = ?', [id]),
      pool.query('SELECT * FROM properties_metadata WHERE property_id = ?', [id]),
      pool.query('SELECT * FROM property_gallery WHERE property_id = ?', [id]),
      pool.query('SELECT COUNT(*) as count FROM saved_property WHERE property_id = ?', [id])
    ]);

    // Get property type details if property_type exists
    let propertyTypeDetails = null;
    if (property.property_type) {
      const [typeRows] = await pool.query(
        'SELECT * FROM property_types WHERE slug = ? AND status = 1',
        [property.property_type]
      );
      if (typeRows.length > 0) {
        propertyTypeDetails = typeRows[0];
      }
    }

    return {
      success: true,
      message: 'Property found with all related data',
      data: {
        ...property,
        locations: locations[0],
        prices: prices[0].length > 0 ? prices[0][0] : null,
        metadata: metadata[0].length > 0 ? metadata[0][0] : null,
        gallery: gallery[0],
        savedCount: savedCount[0][0].count,
        propertyTypeDetails
      }
    };
  } catch (error) {
    throw error;
  }
};

export const getPropertyBySlug = async (slug) => {
  try {
    const [propertyRows] = await pool.query(
      'SELECT * FROM properties WHERE property_slug = ? AND status = 1',
      [slug]
    );
    
    if (propertyRows.length === 0) {
      return {
        success: false,
        message: `Property with slug '${slug}' not found`,
        data: null
      };
    }

    const property = propertyRows[0];
    const propertyId = property.id;

    // Fetch related data
    const relatedData = await getPropertyById(propertyId);
    
    if (!relatedData.success) {
      return relatedData;
    }

    return {
      success: true,
      message: 'Property found',
      data: relatedData.data
    };
  } catch (error) {
    throw error;
  }
};

export const getAllProperties = async (filters = {}, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    let whereConditions = ['p.status = 1'];
    const params = [];

    // Build dynamic WHERE clause
    if (filters.city_id) {
      whereConditions.push('p.city_id = ?');
      params.push(filters.city_id);
    }

    if (filters.property_type) {
      whereConditions.push('p.property_type = ?');
      params.push(filters.property_type);
    }

    if (filters.min_price) {
      whereConditions.push('p.price >= ?');
      params.push(filters.min_price);
    }

    if (filters.max_price) {
      whereConditions.push('p.price <= ?');
      params.push(filters.max_price);
    }

    if (filters.bedroom) {
      whereConditions.push('p.bedroom = ?');
      params.push(filters.bedroom);
    }

    if (filters.listing_type) {
      whereConditions.push('p.listing_type = ?');
      params.push(filters.listing_type);
    }

    if (filters.property_purpose) {
      whereConditions.push('p.property_purpose = ?');
      params.push(filters.property_purpose);
    }

    if (filters.developer_id) {
      whereConditions.push('p.developer_id = ?');
      params.push(filters.developer_id);
    }

    if (filters.featured_only === 'true' || filters.featured_only === true) {
      whereConditions.push("p.featured_property = '1'");
    }

    if (filters.search) {
      whereConditions.push('(p.property_name LIKE ? OR p.keyword LIKE ? OR p.description LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.user_id) {
      whereConditions.push('p.user_id = ?');
      params.push(filters.user_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Sorting
    let orderBy = 'p.created_at DESC';
    if (filters.sort_by === 'price_asc') orderBy = 'p.price ASC';
    else if (filters.sort_by === 'price_desc') orderBy = 'p.price DESC';
    else if (filters.sort_by === 'area_asc') orderBy = 'p.area ASC';
    else if (filters.sort_by === 'area_desc') orderBy = 'p.area DESC';
    else if (filters.sort_by === 'name_asc') orderBy = 'p.property_name ASC';
    else if (filters.sort_by === 'newest') orderBy = 'p.created_at DESC';
    else if (filters.sort_by === 'oldest') orderBy = 'p.created_at ASC';

    const query = `
      SELECT p.*, 
        pt.types as property_type_name,
        pt.imageurl as property_type_image,
        COALESCE(pr.sale_price, pr.rental_price, p.price) as display_price,
        pm.no_of_bhk,
        pm.size,
        (SELECT COUNT(*) FROM saved_property sp WHERE sp.property_id = p.id) as saved_count,
        (SELECT image_name FROM property_gallery pg WHERE pg.property_id = p.id LIMIT 1) as thumbnail
      FROM properties p
      LEFT JOIN property_types pt ON p.property_type = pt.slug
      LEFT JOIN properties_prices pr ON p.id = pr.property_id
      LEFT JOIN properties_metadata pm ON p.id = pm.property_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [...params, limit, offset]);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM properties p ${whereClause}`;
    const [countResult] = await pool.query(countQuery, params);

    // For each property, fetch locations
    const propertiesWithLocations = await Promise.all(
      rows.map(async (property) => {
        const [locations] = await pool.query(
          'SELECT * FROM property_locations WHERE property_id = ? AND status = 1',
          [property.id]
        );
        return {
          ...property,
          locations
        };
      })
    );

    return {
      success: true,
      message: 'Properties fetched successfully',
      data: propertiesWithLocations,
      pagination: {
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit),
        hasMore: offset + rows.length < countResult[0].total
      },
      filters: filters
    };
  } catch (error) {
    throw error;
  }
};

// ==================== RELATED TABLE OPERATIONS ====================

// Property Types CRUD
export const createPropertyType = async (typeData) => {
  try {
    if (!typeData.types || !typeData.slug) {
      throw new Error('Type name and slug are required');
    }

    const [existing] = await pool.query(
      'SELECT id FROM property_types WHERE slug = ?',
      [typeData.slug]
    );

    if (existing.length > 0) {
      throw new Error('Property type with this slug already exists');
    }

    const fields = Object.keys(typeData);
    const values = Object.values(typeData);
    const placeholders = fields.map(() => '?').join(', ');
    
    const query = `
      INSERT INTO property_types (${fields.join(', ')})
      VALUES (${placeholders})
    `;

    const [result] = await pool.query(query, values);

    return {
      success: true,
      message: 'Property type created successfully',
      typeId: result.insertId,
      data: { id: result.insertId, ...typeData }
    };
  } catch (error) {
    throw error;
  }
};

export const getAllPropertyTypes = async (activeOnly = true) => {
  try {
    const whereClause = activeOnly ? 'WHERE status = 1' : '';
    const query = `SELECT * FROM property_types ${whereClause} ORDER BY types ASC`;
    
    const [rows] = await pool.query(query);

    return {
      success: true,
      data: rows,
      count: rows.length
    };
  } catch (error) {
    throw error;
  }
};

// Property Gallery Operations
export const addPropertyGalleryImages = async (propertyId, images, addedBy) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    if (!Array.isArray(images) || images.length === 0) {
      throw new Error('Images array is required');
    }

    const insertedIds = [];
    for (const image of images) {
      const query = `
        INSERT INTO property_gallery (property_id, image_name, added_by)
        VALUES (?, ?, ?)
      `;
      
      const [result] = await connection.query(query, [propertyId, image, addedBy]);
      insertedIds.push(result.insertId);
    }

    await connection.commit();

    return {
      success: true,
      message: `${images.length} images added to gallery`,
      insertedIds,
      propertyId
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const removeGalleryImage = async (imageId) => {
  try {
    const [result] = await pool.query('DELETE FROM property_gallery WHERE id = ?', [imageId]);

    if (result.affectedRows === 0) {
      throw new Error('Gallery image not found');
    }

    return {
      success: true,
      message: 'Gallery image removed successfully',
      imageId
    };
  } catch (error) {
    throw error;
  }
};

// Saved Property Operations
export const savePropertyForUser = async (userId, propertyId, type = 'favorite') => {
  try {
    // Check if already saved
    const [existing] = await pool.query(
      'SELECT id FROM saved_property WHERE user_id = ? AND property_id = ?',
      [userId, propertyId]
    );

    if (existing.length > 0) {
      // Update existing
      const [result] = await pool.query(
        'UPDATE saved_property SET type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [type, existing[0].id]
      );

      return {
        success: true,
        message: 'Saved property updated',
        savedId: existing[0].id,
        action: 'updated'
      };
    } else {
      // Insert new
      const [result] = await pool.query(
        'INSERT INTO saved_property (user_id, property_id, type) VALUES (?, ?, ?)',
        [userId, propertyId, type]
      );

      return {
        success: true,
        message: 'Property saved successfully',
        savedId: result.insertId,
        action: 'created'
      };
    }
  } catch (error) {
    throw error;
  }
};

export const getSavedPropertiesForUser = async (userId, type = null) => {
  try {
    let query = `
      SELECT sp.*, p.*, pt.types as property_type_name
      FROM saved_property sp
      INNER JOIN properties p ON sp.property_id = p.id AND p.status = 1
      LEFT JOIN property_types pt ON p.property_type = pt.slug
      WHERE sp.user_id = ?
    `;
    
    const params = [userId];
    
    if (type) {
      query += ' AND sp.type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY sp.created_at DESC';

    const [rows] = await pool.query(query, params);

    return {
      success: true,
      data: rows,
      count: rows.length,
      userId
    };
  } catch (error) {
    throw error;
  }
};

export const removeSavedProperty = async (userId, propertyId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM saved_property WHERE user_id = ? AND property_id = ?',
      [userId, propertyId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Saved property not found');
    }

    return {
      success: true,
      message: 'Property removed from saved list',
      userId,
      propertyId
    };
  } catch (error) {
    throw error;
  }
};

// ==================== STATISTICS AND ANALYTICS ====================

export const getPropertyStatistics = async (filters = {}) => {
  try {
    let whereConditions = ['status = 1'];
    const params = [];

    if (filters.user_id) {
      whereConditions.push('user_id = ?');
      params.push(filters.user_id);
    }

    if (filters.start_date) {
      whereConditions.push('created_at >= ?');
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      whereConditions.push('created_at <= ?');
      params.push(filters.end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Main statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_properties,
        COUNT(CASE WHEN featured_property = '1' THEN 1 END) as featured_count,
        COUNT(CASE WHEN listing_type = 'Off plan' THEN 1 END) as offplan_count,
        COUNT(CASE WHEN listing_type = 'Ready' THEN 1 END) as ready_count,
        COUNT(CASE WHEN property_purpose = 'Sale' THEN 1 END) as sale_count,
        COUNT(CASE WHEN property_purpose = 'Rent' THEN 1 END) as rent_count,
        AVG(price) as average_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        SUM(price) as total_value,
        AVG(area) as average_area,
        COUNT(DISTINCT city_id) as unique_cities,
        COUNT(DISTINCT developer_id) as unique_developers,
        COUNT(DISTINCT property_type) as unique_property_types,
        COUNT(DISTINCT user_id) as unique_users
      FROM properties
      ${whereClause}
    `;

    const [stats] = await pool.query(statsQuery, params);

    // Property type breakdown
    const typeQuery = `
      SELECT 
        property_type,
        COUNT(*) as count,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM properties
      ${whereClause}
      GROUP BY property_type
      ORDER BY count DESC
    `;

    const [typeStats] = await pool.query(typeQuery, params);

    // Monthly trend
    const trendQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count,
        AVG(price) as avg_price,
        SUM(price) as total_value
      FROM properties
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      ${whereClause.replace('WHERE', 'AND')}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `;

    const [monthlyTrend] = await pool.query(trendQuery, params);

    // Saved properties statistics
    const savedStatsQuery = `
      SELECT 
        COUNT(*) as total_saved,
        COUNT(DISTINCT user_id) as unique_users_saving,
        COUNT(DISTINCT property_id) as unique_properties_saved
      FROM saved_property
    `;

    const [savedStats] = await pool.query(savedStatsQuery);

    return {
      success: true,
      data: {
        overview: {
          ...stats[0],
          average_price: Math.round(stats[0].average_price || 0),
          min_price: stats[0].min_price || 0,
          max_price: stats[0].max_price || 0,
          total_value: stats[0].total_value || 0,
          average_area: Math.round(stats[0].average_area || 0)
        },
        breakdowns: {
          by_property_type: typeStats,
        },
        trends: {
          monthly: monthlyTrend
        },
        saved_properties: savedStats[0],
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    throw error;
  }
};

// ==================== BULK OPERATIONS ====================

export const bulkUpdatePropertyStatus = async (propertyIds, status) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      throw new Error('Invalid property IDs array');
    }

    const placeholders = propertyIds.map(() => '?').join(',');
    const query = `
      UPDATE properties 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `;

    const [result] = await connection.query(query, [status, ...propertyIds]);

    await connection.commit();

    return {
      success: true,
      message: `${result.affectedRows} properties updated`,
      affectedRows: result.affectedRows,
      propertyIds
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const bulkDeleteProperties = async (propertyIds, hardDelete = false) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      throw new Error('Invalid property IDs array');
    }

    let result;
    const placeholders = propertyIds.map(() => '?').join(',');

    if (hardDelete) {
      const query = `DELETE FROM properties WHERE id IN (${placeholders})`;
      [result] = await connection.query(query, propertyIds);
    } else {
      const query = `
        UPDATE properties 
        SET status = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `;
      [result] = await connection.query(query, propertyIds);
    }

    await connection.commit();

    return {
      success: true,
      message: `${result.affectedRows} properties ${hardDelete ? 'permanently deleted' : 'soft deleted'}`,
      affectedRows: result.affectedRows,
      propertyIds,
      deleteType: hardDelete ? 'hard' : 'soft'
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ==================== SEARCH AND FILTER ====================

export const searchProperties = async (searchCriteria) => {
  try {
    let whereConditions = ['p.status = 1'];
    const params = [];

    // Basic search
    if (searchCriteria.keyword) {
      whereConditions.push(`
        (p.property_name LIKE ? 
        OR p.keyword LIKE ? 
        OR p.description LIKE ?
        OR p.address LIKE ?
        OR p.location LIKE ?)
      `);
      const keyword = `%${searchCriteria.keyword}%`;
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    // Location based
    if (searchCriteria.city_id) {
      whereConditions.push('p.city_id = ?');
      params.push(searchCriteria.city_id);
    }

    if (searchCriteria.community_id) {
      whereConditions.push('p.community_id = ?');
      params.push(searchCriteria.community_id);
    }

    // Price range
    if (searchCriteria.min_price) {
      whereConditions.push('p.price >= ?');
      params.push(searchCriteria.min_price);
    }

    if (searchCriteria.max_price) {
      whereConditions.push('p.price <= ?');
      params.push(searchCriteria.max_price);
    }

    // Property characteristics
    if (searchCriteria.property_type) {
      whereConditions.push('p.property_type = ?');
      params.push(searchCriteria.property_type);
    }

    if (searchCriteria.bedroom) {
      whereConditions.push('p.bedroom = ?');
      params.push(searchCriteria.bedroom);
    }

    if (searchCriteria.property_purpose) {
      whereConditions.push('p.property_purpose = ?');
      params.push(searchCriteria.property_purpose);
    }

    if (searchCriteria.listing_type) {
      whereConditions.push('p.listing_type = ?');
      params.push(searchCriteria.listing_type);
    }

    // Area range
    if (searchCriteria.min_area) {
      whereConditions.push('p.area >= ?');
      params.push(searchCriteria.min_area);
    }

    if (searchCriteria.max_area) {
      whereConditions.push('p.area <= ?');
      params.push(searchCriteria.max_area);
    }

    // Date filters
    if (searchCriteria.created_after) {
      whereConditions.push('p.created_at >= ?');
      params.push(searchCriteria.created_after);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Default sorting
    const orderBy = searchCriteria.sort_by === 'price_asc' ? 'p.price ASC' :
                   searchCriteria.sort_by === 'price_desc' ? 'p.price DESC' :
                   searchCriteria.sort_by === 'newest' ? 'p.created_at DESC' :
                   searchCriteria.sort_by === 'oldest' ? 'p.created_at ASC' :
                   'p.created_at DESC';

    const limit = searchCriteria.limit || 50;
    const offset = searchCriteria.offset || 0;

    const query = `
      SELECT p.*,
        pt.types as property_type_name,
        pm.no_of_bhk,
        pm.size,
        pr.sale_price,
        pr.rental_price,
        (SELECT image_name FROM property_gallery pg WHERE pg.property_id = p.id LIMIT 1) as thumbnail
      FROM properties p
      LEFT JOIN property_types pt ON p.property_type = pt.slug
      LEFT JOIN properties_metadata pm ON p.id = pm.property_id
      LEFT JOIN properties_prices pr ON p.id = pr.property_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [...params, limit, offset]);

    // Total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM properties p ${whereClause}`;
    const [countResult] = await pool.query(countQuery, params);

    return {
      success: true,
      data: rows,
      total: countResult[0].total,
      limit,
      offset,
      searchCriteria
    };
  } catch (error) {
    throw error;
  }
};

export default {
  createPropertyTables,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyById,
  getPropertyBySlug,
  getAllProperties,
  createPropertyType,
  getAllPropertyTypes,
  addPropertyGalleryImages,
  removeGalleryImage,
  savePropertyForUser,
  getSavedPropertiesForUser,
  removeSavedProperty,
  getPropertyStatistics,
  bulkUpdatePropertyStatus,
  bulkDeleteProperties,
  searchProperties
};