// backend/models/projects/project.model.js
import pool from '../../config/db.js'; // Ensure this path is correct
import path from 'path'; // Needed for path manipulation if necessary for DB paths

// ==================== TABLE CREATION FOR ALL PROJECT TABLES ====================

export const createProjectTables = async () => {
  const tables = [
    // Private Amenities table
    `
    CREATE TABLE IF NOT EXISTS private_amenities (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,

    // Project Data table (Consider merging with project_listing if it's one-to-one)
    `
    CREATE TABLE IF NOT EXISTS project_data (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sub_community_id INT(11),
      name VARCHAR(255) NOT NULL,
      status INT(11) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sub_community_id (sub_community_id),
      INDEX idx_status (status),
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,

    // Project Listing table (Main)
    `
    CREATE TABLE IF NOT EXISTS project_listing (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT(11),
      state_id INT(11),
      city_id INT(11),
      community_id INT(11),
      sub_community_id INT(11),
      listing_type VARCHAR(60),
      occupancy VARCHAR(60),
      qc VARCHAR(10),
      completion_date DATE,
      vacating_date DATE,
      exclusive_status VARCHAR(100),
      property_ids TEXT,
      floor_media_ids VARCHAR(255),
      gallery_media_ids TEXT,
      developer_id INT(11),
      ProjectId VARCHAR(100),
      ProjectNumber VARCHAR(100),
      MemberId VARCHAR(100),
      ProjectName VARCHAR(255),
      Description LONGTEXT,
      featured_project VARCHAR(10) DEFAULT '0',
      dld_permit VARCHAR(255),
      views INT(11) DEFAULT 0,
      title_deep VARCHAR(255),
      Spa_number VARCHAR(50),
      from_duration VARCHAR(20),
      to_duration VARCHAR(20),
      availability_type VARCHAR(20),
      price DECIMAL(15,2),
      price_end DECIMAL(15,2),
      askprice VARCHAR(10) DEFAULT '0',
      currency_id INT(11) DEFAULT 1,
      property_type VARCHAR(255),
      unit VARCHAR(255),
      bedroom VARCHAR(255),
      area DECIMAL(10,2),
      area_end DECIMAL(10,2),
      area_size VARCHAR(100) DEFAULT 'Sq.Ft.',
      agent_id INT(11),
      Specifications TEXT,
      StartDate DATE,
      EndDate DATE,
      BuildingName VARCHAR(255),
      StreetName VARCHAR(255),
      LocationName VARCHAR(255),
      CityName VARCHAR(255),
      StateName VARCHAR(255),
      PinCode VARCHAR(20),
      LandMark VARCHAR(255),
      country VARCHAR(100) DEFAULT 'UAE',
      floors INT(11),
      rooms INT(11),
      total_building INT(11),
      kitchen_type VARCHAR(100),
      amenities TEXT,
      Vaastu VARCHAR(50),
      Lift INT(11) DEFAULT 0,
      Club INT(11) DEFAULT 0,
      RainWaterHaresting INT(11) DEFAULT 0,
      PowerBackup INT(11) DEFAULT 0,
      GasConnection INT(11) DEFAULT 0,
      SwimmingPool INT(11) DEFAULT 0,
      Parking INT(11) DEFAULT 0,
      Security INT(11) DEFAULT 0,
      InternetConnection INT(11) DEFAULT 0,
      Gym INT(11) DEFAULT 0,
      ServantQuarters INT(11) DEFAULT 0,
      Balcony INT(11) DEFAULT 0,
      PlayArea INT(11) DEFAULT 0,
      CCTV INT(11) DEFAULT 0,
      ReservedPark INT(11) DEFAULT 0,
      Intercom INT(11) DEFAULT 0,
      Lawn INT(11) DEFAULT 0,
      Terrace INT(11) DEFAULT 0,
      Garden INT(11) DEFAULT 0,
      EarthquakeConstruction INT(11) DEFAULT 0,
      LogoUrl VARCHAR(500),
      Url VARCHAR(500),
      video_url VARCHAR(500),
      whatsapp_url VARCHAR(500),
      featured_image VARCHAR(500),
      IsFeatured INT(11) DEFAULT 0,
      LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      keyword TEXT,
      seo_title TEXT,
      meta_description TEXT,
      canonical_tags VARCHAR(255),
      project_slug VARCHAR(255) UNIQUE,
      listing_agent_id INT(11),
      identifying_channel VARCHAR(100),
      marketing_channel VARCHAR(100),
      contact_channel VARCHAR(100),
      owner_id INT(11),
      owner_developer_id VARCHAR(255),
      owner_agreement VARCHAR(100),
      owner_commision VARCHAR(100),
      owner_creation_date DATE,
      owner_listing_date DATE,
      documents_id VARCHAR(255),
      status INT(11) DEFAULT 1,
      verified INT(11) DEFAULT 0,
      template VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_project_slug (project_slug),
      INDEX idx_user_id (user_id),
      INDEX idx_developer_id (developer_id),
      INDEX idx_city_id (city_id),
      INDEX idx_status (status),
      INDEX idx_featured (featured_project),
      INDEX idx_listing_type (listing_type),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,

    // Project Gallery table
    `
    CREATE TABLE IF NOT EXISTS project_gallery (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      project_id INT(10) UNSIGNED NOT NULL,
      Url VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES project_listing(id) ON DELETE CASCADE,
      INDEX idx_project_id (project_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,

    // Project Specs table
    `
    CREATE TABLE IF NOT EXISTS project_specs (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      project_id INT(10) UNSIGNED NOT NULL,
      ReraNumber VARCHAR(255),
      EmployeeName VARCHAR(255),
      EmployeeMobile VARCHAR(50),
      EmployeeEmail VARCHAR(255),
      MemberName VARCHAR(255),
      MemberMobile VARCHAR(50),
      ReplyEmail VARCHAR(255),
      ReplyMobile VARCHAR(50),
      Title VARCHAR(255),
      CompanyName VARCHAR(255),
      MaxArea DECIMAL(10,2),
      MinArea DECIMAL(10,2),
      MaxPrice DECIMAL(15,2),
      MinPrice DECIMAL(15,2),
      ProjectPlanText TEXT,
      TotalRoomCsv TEXT,
      PropertyTypeCsv TEXT,
      Latitude VARCHAR(100),
      Longitude VARCHAR(100),
      WebsiteKeyword TEXT,
      DeveloperName VARCHAR(255),
      OtherAmenities TEXT,
      TransactionName VARCHAR(255),
      PossessionName VARCHAR(255),
      VirtualTour VARCHAR(500),
      YouTubeUrl VARCHAR(500),
      TotalRecords INT(11),
      IsCommencement INT(11) DEFAULT 0,
      IsOccupancy INT(11) DEFAULT 0,
      ApprovedBy VARCHAR(255),
      TotalArea DECIMAL(15,2),
      OpenSpace DECIMAL(10,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES project_listing(id) ON DELETE CASCADE,
      INDEX idx_project_id (project_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,

    // Project Contacts table
    `
    CREATE TABLE IF NOT EXISTS project_contacts (
      id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      project_id INT(10) UNSIGNED NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES project_listing(id) ON DELETE CASCADE,
      INDEX idx_project_id (project_id),
      INDEX idx_created_at (created_at)
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
    
    return { success: true, message: 'All project tables created successfully' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ==================== MAIN PROJECT OPERATIONS ====================

export const createProject = async (projectData, relatedData = {}) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Validate required fields (can be moved to a validator middleware)
    if (!projectData.ProjectName || !projectData.project_slug) {
      throw new Error('Project name and slug are required fields');
    }

    // Check if slug already exists
    const [existingSlug] = await connection.query(
      'SELECT id FROM project_listing WHERE project_slug = ?',
      [projectData.project_slug]
    );

    if (existingSlug.length > 0) {
      throw new Error('Project with this slug already exists');
    }

    // Insert main project data
    const projectFields = Object.keys(projectData);
    const projectValues = Object.values(projectData);
    const projectPlaceholders = projectFields.map(() => '?').join(', ');
    
    const projectQuery = `
      INSERT INTO project_listing (${projectFields.join(', ')})
      VALUES (${projectPlaceholders})
    `;

    const [projectResult] = await connection.query(projectQuery, projectValues);
    const projectId = projectResult.insertId;

    // Insert related data if provided
    const insertedRelated = {};

    // Insert project specs
    if (relatedData.specs) {
      const specsData = { project_id: projectId, ...relatedData.specs };
      const specsFields = Object.keys(specsData);
      const specsValues = Object.values(specsData);
      const specsPlaceholders = specsFields.map(() => '?').join(', ');
      
      const specsQuery = `
        INSERT INTO project_specs (${specsFields.join(', ')})
        VALUES (${specsPlaceholders})
      `;
      
      const [specsResult] = await connection.query(specsQuery, specsValues);
      insertedRelated.specs = specsResult.insertId;
    }

    // Insert gallery images
    if (relatedData.gallery && Array.isArray(relatedData.gallery)) {
      const galleryInserts = [];
      for (const image of relatedData.gallery) {
        const galleryQuery = `
          INSERT INTO project_gallery (project_id, Url)
          VALUES (?, ?)
        `;
        // image.Url || image handles cases where image might be { Url: 'path' } or just 'path'
        const [galleryResult] = await connection.query(galleryQuery, [projectId, image.Url || image]);
        galleryInserts.push(galleryResult.insertId);
      }
      insertedRelated.gallery = galleryInserts;
    }

    await connection.commit();

    // Fetch the newly created project to return
    const [newProjectRows] = await connection.query('SELECT * FROM project_listing WHERE id = ?', [projectId]);

    return {
      success: true,
      message: 'Project created successfully',
      projectId,
      relatedIds: insertedRelated,
      data: newProjectRows[0] || null
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateProject = async (id, updateData, relatedUpdates = {}) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Check if project exists
    const [existing] = await connection.query(
      'SELECT id, project_slug FROM project_listing WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // If slug is being updated, check for duplicates
    if (updateData.project_slug && updateData.project_slug !== existing[0].project_slug) {
      const [slugCheck] = await connection.query(
        'SELECT id FROM project_listing WHERE project_slug = ? AND id != ?',
        [updateData.project_slug, id]
      );

      if (slugCheck.length > 0) {
        throw new Error('Project with this slug already exists');
      }
    }

    // Update main project data if provided
    let projectUpdateAffectedRows = 0;
    if (Object.keys(updateData).length > 0) {
      const disallowedFields = ['id', 'created_at']; // Fields that should not be updated directly
      disallowedFields.forEach(field => delete updateData[field]);

      const fields = Object.keys(updateData);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = [...Object.values(updateData), id];

      const query = `
        UPDATE project_listing 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const [result] = await connection.query(query, values);
      projectUpdateAffectedRows = result.affectedRows;
    }

    // Update related data if provided
    const updatedRelated = {};

    // Update project specs
    if (relatedUpdates.specs) {
      const [existingSpecs] = await connection.query(
        'SELECT id FROM project_specs WHERE project_id = ?',
        [id]
      );

      if (existingSpecs.length > 0) {
        // Update existing specs
        const specsFields = Object.keys(relatedUpdates.specs);
        const specsSetClause = specsFields.map(field => `${field} = ?`).join(', ');
        const specsValues = [...Object.values(relatedUpdates.specs), id];
        
        const specsQuery = `
          UPDATE project_specs 
          SET ${specsSetClause}, updated_at = CURRENT_TIMESTAMP
          WHERE project_id = ?
        `;
        
        await connection.query(specsQuery, specsValues);
        updatedRelated.specs = existingSpecs[0].id;
      } else {
        // Insert new specs
        const specsData = { project_id: id, ...relatedUpdates.specs };
        const specsFields = Object.keys(specsData);
        const specsValues = Object.values(specsData);
        const specsPlaceholders = specsFields.map(() => '?').join(', ');
        
        const specsQuery = `
          INSERT INTO project_specs (${specsFields.join(', ')})
          VALUES (${specsPlaceholders})
        `;
        
        const [specsResult] = await connection.query(specsQuery, specsValues);
        updatedRelated.specs = specsResult.insertId;
      }
    }

    // Update gallery images (replace all for simplicity in this example)
    if (relatedUpdates.gallery !== undefined) {
      // Delete existing gallery images for this project
      await connection.query('DELETE FROM project_gallery WHERE project_id = ?', [id]);
      
      if (Array.isArray(relatedUpdates.gallery) && relatedUpdates.gallery.length > 0) {
        const galleryInserts = [];
        for (const image of relatedUpdates.gallery) {
          const galleryQuery = `
            INSERT INTO project_gallery (project_id, Url)
            VALUES (?, ?)
          `;
          
          const [galleryResult] = await connection.query(galleryQuery, [id, image.Url || image]);
          galleryInserts.push(galleryResult.insertId);
        }
        updatedRelated.gallery = galleryInserts;
      } else if (relatedUpdates.gallery === null) {
        // Handle case where gallery is explicitly set to null/empty
        updatedRelated.gallery = [];
      }
    }

    await connection.commit();

    // Fetch the updated project to return
    const [updatedProjectRows] = await connection.query('SELECT * FROM project_listing WHERE id = ?', [id]);

    return {
      success: true,
      message: 'Project updated successfully',
      projectId: id,
      mainUpdated: projectUpdateAffectedRows,
      relatedUpdated: updatedRelated,
      data: updatedProjectRows[0] || null
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteProject = async (id, hardDelete = false) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Check if project exists
    const [existing] = await connection.query(
      'SELECT id, ProjectName, status FROM project_listing WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      throw new Error(`Project with ID ${id} not found`);
    }

    let result;
    let message;

    if (hardDelete) {
      // Cascade delete will handle related tables due to foreign keys
      const query = 'DELETE FROM project_listing WHERE id = ?';
      [result] = await connection.query(query, [id]);
      message = 'Project and all related data permanently deleted';
    } else {
      // Soft delete - update status to 0
      const query = 'UPDATE project_listing SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      [result] = await connection.query(query, [id]);
      message = 'Project soft deleted (status set to 0)';
    }

    await connection.commit();

    if (result.affectedRows === 0) {
      throw new Error('Project deletion failed');
    }

    return {
      success: true,
      message,
      projectId: id,
      projectName: existing[0].ProjectName,
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

// ==================== PROJECT FETCH OPERATIONS ====================

export const getProjectById = async (id) => {
  try {
    // Get main project data
    const [projectRows] = await pool.query(
      'SELECT pl.*, ps.DeveloperName as developer_name_specs, ps.Latitude as latitude_specs, ps.Longitude as longitude_specs FROM project_listing pl LEFT JOIN project_specs ps ON pl.id = ps.project_id WHERE pl.id = ?',
      [id]
    );
    
    if (projectRows.length === 0) {
      return {
        success: false,
        message: `Project with ID ${id} not found`,
        data: null
      };
    }

    const project = projectRows[0];

    // Fetch all related data in parallel
    const [
      specs,
      gallery,
      contacts
    ] = await Promise.all([
      pool.query('SELECT * FROM project_specs WHERE project_id = ?', [id]),
      pool.query('SELECT id, Url FROM project_gallery WHERE project_id = ?', [id]), // Select specific fields for gallery
      pool.query('SELECT id, name, email, phone, message, created_at FROM project_contacts WHERE project_id = ? ORDER BY created_at DESC', [id]) // Select specific fields for contacts
    ]);

    return {
      success: true,
      message: 'Project found with all related data',
      data: {
        ...project,
        specs: specs[0].length > 0 ? specs[0][0] : null,
        gallery: gallery[0], // Array of { id, Url }
        contacts: contacts[0]
      }
    };
  } catch (error) {
    throw error;
  }
};

export const getProjectBySlug = async (slug) => {
  try {
    const [projectRows] = await pool.query(
      'SELECT pl.*, ps.DeveloperName as developer_name_specs, ps.Latitude as latitude_specs, ps.Longitude as longitude_specs FROM project_listing pl LEFT JOIN project_specs ps ON pl.id = ps.project_id WHERE pl.project_slug = ?',
      [slug]
    );
    
    if (projectRows.length === 0) {
      return {
        success: false,
        message: `Project with slug '${slug}' not found`,
        data: null
      };
    }

    const project = projectRows[0];
    const projectId = project.id;

    // Increment views
    await pool.query('UPDATE project_listing SET views = views + 1 WHERE id = ?', [projectId]);

    // Fetch related data using getProjectById to keep consistent structure
    const relatedData = await getProjectById(projectId);
    
    if (!relatedData.success) {
      return relatedData; // Return error if fetching related data failed
    }

    return {
      success: true,
      message: 'Project found',
      data: relatedData.data
    };
  } catch (error) {
    throw error;
  }
};


export const getAllProjects = async (filters = {}, pagination = {}) => {
  try {
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 20;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    const params = [];

    // Default filter - only active projects
    if (filters.include_inactive !== true) { // Changed to strict boolean check
      whereConditions.push('pl.status = 1');
    }
    // Allow explicit status filter to override default active only
    if (filters.status !== undefined && filters.status !== null) {
      whereConditions.push('pl.status = ?');
      params.push(filters.status);
    }


    // Build dynamic WHERE clause
    if (filters.city_id) {
      whereConditions.push('pl.city_id = ?');
      params.push(filters.city_id);
    }

    if (filters.state_id) {
      whereConditions.push('pl.state_id = ?');
      params.push(filters.state_id);
    }

    if (filters.community_id) {
      whereConditions.push('pl.community_id = ?');
      params.push(filters.community_id);
    }

    if (filters.sub_community_id) {
      whereConditions.push('pl.sub_community_id = ?');
      params.push(filters.sub_community_id);
    }

    if (filters.developer_id) {
      whereConditions.push('pl.developer_id = ?');
      params.push(filters.developer_id);
    }

    if (filters.listing_type) {
      whereConditions.push('pl.listing_type = ?');
      params.push(filters.listing_type);
    }

    if (filters.property_type) {
      whereConditions.push('pl.property_type = ?');
      params.push(filters.property_type);
    }

    if (filters.min_price) {
      whereConditions.push('pl.price >= ?');
      params.push(filters.min_price);
    }

    if (filters.max_price) {
      whereConditions.push('pl.price <= ?');
      params.push(filters.max_price);
    }

    if (filters.bedroom) {
      whereConditions.push('pl.bedroom = ?');
      params.push(filters.bedroom);
    }

    if (filters.featured_only === true) { // Strict boolean check
      whereConditions.push("pl.featured_project = '1'");
    }

    if (filters.verified_only === true) { // Strict boolean check
      whereConditions.push("pl.verified = 1");
    }

    if (filters.search) {
      whereConditions.push('(pl.ProjectName LIKE ? OR pl.Description LIKE ? OR pl.keyword LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.user_id) {
      whereConditions.push('pl.user_id = ?');
      params.push(filters.user_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Sorting
    let orderBy = 'pl.created_at DESC';
    
    if (filters.sort_by) {
      const sortMap = {
        'price_asc': 'pl.price ASC',
        'price_desc': 'pl.price DESC',
        'area_asc': 'pl.area ASC',
        'area_desc': 'pl.area DESC',
        'name_asc': 'pl.ProjectName ASC',
        'name_desc': 'pl.ProjectName DESC',
        'newest': 'pl.created_at DESC',
        'oldest': 'pl.created_at ASC',
        'views': 'pl.views DESC',
        'id': 'pl.id DESC' // Default to ID desc if sort_by is 'id'
      };
      orderBy = sortMap[filters.sort_by] || orderBy;
    }

    // if (filters.sort_order && filters.sort_order.toLowerCase() === 'asc') {
    //   orderBy = orderBy.replace('DESC', 'ASC'); // This might double-flip if sort_by already specified ASC
    // }

    const query = `
      SELECT pl.*, 
        ps.ReraNumber,
        ps.DeveloperName as developer_name_specs,
        ps.MinPrice,
        ps.MaxPrice,
        ps.MinArea,
        ps.MaxArea,
        ps.Latitude as latitude_specs,
        ps.Longitude as longitude_specs,
        (SELECT Url FROM project_gallery pg WHERE pg.project_id = pl.id ORDER BY pg.id ASC LIMIT 1) as thumbnail_url,
        (SELECT COUNT(*) FROM project_gallery pg WHERE pg.project_id = pl.id) as gallery_count,
        (SELECT COUNT(*) FROM project_contacts pc WHERE pc.project_id = pl.id) as contacts_count
      FROM project_listing pl
      LEFT JOIN project_specs ps ON pl.id = ps.project_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [...params, limit, offset]);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM project_listing pl ${whereClause}`;
    const [countResult] = await pool.query(countQuery, params);

    return {
      success: true,
      message: 'Projects fetched successfully',
      data: rows,
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

// ==================== AMENITIES OPERATIONS ====================

export const createAmenity = async (name) => {
  try {
    if (!name) {
      throw new Error('Amenity name is required');
    }

    const [existing] = await pool.query(
      'SELECT id FROM private_amenities WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      throw new Error('Amenity with this name already exists');
    }

    const [result] = await pool.query(
      'INSERT INTO private_amenities (name) VALUES (?)',
      [name]
    );

    return {
      success: true,
      message: 'Amenity created successfully',
      amenityId: result.insertId,
      data: { id: result.insertId, name }
    };
  } catch (error) {
    throw error;
  }
};

export const getAllAmenities = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM private_amenities ORDER BY name ASC');

    return {
      success: true,
      data: rows,
      count: rows.length
    };
  } catch (error) {
    throw error;
  }
};

export const deleteAmenity = async (id) => {
  try {
    const [result] = await pool.query('DELETE FROM private_amenities WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      throw new Error('Amenity not found');
    }

    return {
      success: true,
      message: 'Amenity deleted successfully',
      amenityId: id
    };
  } catch (error) {
    throw error;
  }
};

// ==================== PROJECT GALLERY OPERATIONS ====================

export const addProjectGalleryImages = async (projectId, images) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    if (!Array.isArray(images) || images.length === 0) {
      throw new Error('Images array is required');
    }

    const insertedIds = [];
    for (const imageUrl of images) {
      const query = 'INSERT INTO project_gallery (project_id, Url) VALUES (?, ?)';
      const [result] = await connection.query(query, [projectId, imageUrl]);
      insertedIds.push(result.insertId);
    }

    await connection.commit();

    return {
      success: true,
      message: `${images.length} images added to gallery`,
      insertedIds,
      projectId
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
    const [result] = await pool.query('DELETE FROM project_gallery WHERE id = ?', [imageId]);

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

// ==================== PROJECT CONTACT OPERATIONS ====================

export const createProjectContact = async (contactData) => {
  try {
    if (!contactData.project_id || !contactData.name) {
      throw new Error('Project ID and name are required');
    }

    const fields = Object.keys(contactData);
    const values = Object.values(contactData);
    const placeholders = fields.map(() => '?').join(', ');
    
    const query = `
      INSERT INTO project_contacts (${fields.join(', ')})
      VALUES (${placeholders})
    `;

    const [result] = await pool.query(query, values);

    return {
      success: true,
      message: 'Contact inquiry submitted successfully',
      contactId: result.insertId,
      data: { id: result.insertId, ...contactData }
    };
  } catch (error) {
    throw error;
  }
};

export const getProjectContacts = async (projectId, limit = 50) => {
  try {
    const query = `
      SELECT * FROM project_contacts 
      WHERE project_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    
    const [rows] = await pool.query(query, [projectId, limit]);

    return {
      success: true,
      data: rows,
      count: rows.length,
      projectId
    };
  } catch (error) {
    throw error;
  }
};

// ==================== STATISTICS AND ANALYTICS ====================

export const getProjectStatistics = async (filters = {}) => {
  try {
    let whereConditions = ['pl.status = 1'];
    const params = [];

    if (filters.user_id) {
      whereConditions.push('pl.user_id = ?');
      params.push(filters.user_id);
    }

    if (filters.start_date) {
      whereConditions.push('pl.created_at >= ?');
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      whereConditions.push('pl.created_at <= ?');
      params.push(filters.end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Main statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN featured_project = '1' THEN 1 END) as featured_count,
        COUNT(CASE WHEN verified = 1 THEN 1 END) as verified_count,
        COUNT(CASE WHEN listing_type = 'Off plan' THEN 1 END) as offplan_count,
        COUNT(CASE WHEN listing_type = 'Ready' THEN 1 END) as ready_count,
        AVG(price) as average_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        SUM(price) as total_value,
        AVG(area) as average_area,
        SUM(views) as total_views,
        COUNT(DISTINCT city_id) as unique_cities,
        COUNT(DISTINCT developer_id) as unique_developers,
        COUNT(DISTINCT user_id) as unique_users
      FROM project_listing pl
      ${whereClause}
    `;

    const [stats] = await pool.query(statsQuery, params);

    // Property type breakdown
    const typeQuery = `
      SELECT 
        property_type,
        COUNT(*) as count,
        AVG(price) as avg_price
      FROM project_listing pl
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
        SUM(views) as total_views
      FROM project_listing pl
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      ${whereClause.replace('WHERE', 'AND')}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `;

    const [monthlyTrend] = await pool.query(trendQuery, params);

    // Contact statistics
    const contactStatsQuery = `
      SELECT 
        COUNT(*) as total_contacts,
        COUNT(DISTINCT project_id) as projects_with_contacts,
        DATE(MAX(created_at)) as latest_contact
      FROM project_contacts
    `;

    const [contactStats] = await pool.query(contactStatsQuery);

    return {
      success: true,
      data: {
        overview: {
          ...stats[0],
          average_price: Math.round(stats[0].average_price || 0),
          average_area: Math.round(stats[0].average_area || 0)
        },
        breakdowns: {
          by_property_type: typeStats
        },
        trends: {
          monthly: monthlyTrend
        },
        contacts: contactStats[0],
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    throw error;
  }
};

// ==================== BULK OPERATIONS ====================

export const bulkUpdateProjectStatus = async (projectIds, status) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      throw new Error('Invalid project IDs array');
    }

    const placeholders = projectIds.map(() => '?').join(',');
    const query = `
      UPDATE project_listing 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `;

    const [result] = await connection.query(query, [status, ...projectIds]);

    await connection.commit();

    return {
      success: true,
      message: `${result.affectedRows} projects updated`,
      affectedRows: result.affectedRows,
      projectIds
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const bulkDeleteProjects = async (projectIds, hardDelete = false) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      throw new Error('Invalid project IDs array');
    }

    let result;
    const placeholders = projectIds.map(() => '?').join(',');

    if (hardDelete) {
      const query = `DELETE FROM project_listing WHERE id IN (${placeholders})`;
      [result] = await connection.query(query, projectIds);
    } else {
      const query = `
        UPDATE project_listing 
        SET status = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders})
      `;
      [result] = await connection.query(query, projectIds);
    }

    await connection.commit();

    return {
      success: true,
      message: `${result.affectedRows} projects ${hardDelete ? 'permanently deleted' : 'soft deleted'}`,
      affectedRows: result.affectedRows,
      projectIds,
      deleteType: hardDelete ? 'hard' : 'soft'
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ==================== SEARCH ====================

export const searchProjects = async (searchCriteria) => {
  try {
    let whereConditions = ['pl.status = 1']; // Default to active projects
    const params = [];

    // Keyword search
    if (searchCriteria.keyword) {
      whereConditions.push(`
        (pl.ProjectName LIKE ? 
        OR pl.Description LIKE ? 
        OR pl.keyword LIKE ?
        OR pl.BuildingName LIKE ?
        OR pl.LocationName LIKE ?)
      `);
      const keyword = `%${searchCriteria.keyword}%`;
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    // Explicit status filter
    if (searchCriteria.status !== undefined && searchCriteria.status !== null) {
      whereConditions.push('pl.status = ?');
      params.push(searchCriteria.status);
    }

    // Location filters
    if (searchCriteria.city_id) {
      whereConditions.push('pl.city_id = ?');
      params.push(searchCriteria.city_id);
    }

    if (searchCriteria.state_id) {
      whereConditions.push('pl.state_id = ?');
      params.push(searchCriteria.state_id);
    }

    // Price range
    if (searchCriteria.min_price) {
      whereConditions.push('pl.price >= ?');
      params.push(searchCriteria.min_price);
    }

    if (searchCriteria.max_price) {
      whereConditions.push('pl.price <= ?');
      params.push(searchCriteria.max_price);
    }

    // Property type
    if (searchCriteria.property_type) {
      whereConditions.push('pl.property_type = ?');
      params.push(searchCriteria.property_type);
    }

    // Bedrooms
    if (searchCriteria.bedroom) {
      whereConditions.push('pl.bedroom = ?');
      params.push(searchCriteria.bedroom);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const orderBy = searchCriteria.sort_by === 'price_asc' ? 'pl.price ASC' :
                   searchCriteria.sort_by === 'price_desc' ? 'pl.price DESC' :
                   searchCriteria.sort_by === 'newest' ? 'pl.created_at DESC' :
                   'pl.created_at DESC'; // Default sort

    const limit = searchCriteria.limit || 50;
    const offset = searchCriteria.offset || 0;

    const query = `
      SELECT pl.*,
        ps.DeveloperName as developer_name_specs,
        ps.MinPrice,
        ps.MaxPrice,
        ps.Latitude as latitude_specs,
        ps.Longitude as longitude_specs,
        (SELECT Url FROM project_gallery pg WHERE pg.project_id = pl.id ORDER BY pg.id ASC LIMIT 1) as thumbnail
      FROM project_listing pl
      LEFT JOIN project_specs ps ON pl.id = ps.project_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [...params, limit, offset]);

    const countQuery = `SELECT COUNT(*) as total FROM project_listing pl ${whereClause}`;
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