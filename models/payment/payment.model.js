// models/payment/payment.model.js

import pool from '../../config/db.js';

/* =========================================================
   TABLE CREATION
========================================================= */

export const createPaymentTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER,
      stripe_payment_id VARCHAR(255) UNIQUE NOT NULL,
      stripe_customer_id VARCHAR(255),
      amount DECIMAL(12, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'aed',
      payment_status VARCHAR(50) DEFAULT 'pending',
      payment_type VARCHAR(50) DEFAULT 'full',
      payment_method VARCHAR(50),
      description TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_payment_user_id ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payment_status ON payments(payment_status);
    CREATE INDEX IF NOT EXISTS idx_payment_stripe_id ON payments(stripe_payment_id);
  `;

  try {
    await pool.query(query);
  } catch (err) {
    if (!err.message.includes('already exists')) {
      console.log('Payment table note:', err.message);
    }
  }
};

export const createSubscriptionTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
      stripe_customer_id VARCHAR(255) NOT NULL,
      plan_name VARCHAR(100) NOT NULL,
      plan_amount DECIMAL(12, 2) NOT NULL,
      plan_interval VARCHAR(20) DEFAULT 'month',
      status VARCHAR(50) DEFAULT 'active',
      current_period_start TIMESTAMP,
      current_period_end TIMESTAMP,
      cancel_at_period_end BOOLEAN DEFAULT false,
      canceled_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_subscription_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscription_status ON subscriptions(status);
  `;

  try {
    await pool.query(query);
  } catch (err) {
    if (!err.message.includes('already exists')) {
      console.log('Subscription table note:', err.message);
    }
  }
};

export const createRefundTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS refunds (
      id SERIAL PRIMARY KEY,
      payment_id INTEGER REFERENCES payments(id) ON DELETE CASCADE,
      stripe_refund_id VARCHAR(255) UNIQUE NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      reason VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_refund_payment_id ON refunds(payment_id);
  `;

  try {
    await pool.query(query);
  } catch (err) {
    if (!err.message.includes('already exists')) {
      console.log('Refund table note:', err.message);
    }
  }
};

/* =========================================================
   PAYMENT CRUD
========================================================= */

export const createPayment = async (data) => {
  const {
    user_id,
    project_id = null,
    stripe_payment_id,
    stripe_customer_id,
    amount,
    currency = 'aed',
    payment_status = 'pending',
    payment_type = 'full',
    payment_method = null,
    description = null,
    metadata = {}
  } = data;

  const query = `
    INSERT INTO payments (
      user_id, project_id, stripe_payment_id, stripe_customer_id,
      amount, currency, payment_status, payment_type,
      payment_method, description, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
  `;

  const values = [
    user_id,
    project_id,
    stripe_payment_id,
    stripe_customer_id,
    amount,
    currency.toLowerCase(),
    payment_status,
    payment_type,
    payment_method,
    description,
    JSON.stringify(metadata)
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getPaymentById = async (id) => {
  const query = `
    SELECT p.*, u.name as user_name, u.email as user_email
    FROM payments p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = $1;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

export const getPaymentByStripeId = async (stripePaymentId) => {
  const query = `SELECT * FROM payments WHERE stripe_payment_id = $1;`;
  const { rows } = await pool.query(query, [stripePaymentId]);
  return rows[0];
};

export const getUserPayments = async (userId, limit = 50, offset = 0) => {
  const query = `
    SELECT * FROM payments 
    WHERE user_id = $1 
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const { rows } = await pool.query(query, [userId, limit, offset]);
  return rows;
};

export const updatePaymentStatus = async (stripePaymentId, status, additionalData = {}) => {
  const fields = ['payment_status = $1'];
  const values = [status];
  let index = 2;

  for (const key in additionalData) {
    if (additionalData[key] !== undefined) {
      fields.push(`${key} = $${index}`);
      values.push(additionalData[key]);
      index++;
    }
  }

  const query = `
    UPDATE payments 
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
    WHERE stripe_payment_id = $${index}
    RETURNING *;
  `;

  values.push(stripePaymentId);
  const { rows } = await pool.query(query, values);
  return rows[0];
};

/* =========================================================
   SUBSCRIPTION CRUD
========================================================= */

export const createSubscription = async (data) => {
  const {
    user_id,
    stripe_subscription_id,
    stripe_customer_id,
    plan_name,
    plan_amount,
    plan_interval = 'month',
    status = 'active',
    current_period_start,
    current_period_end
  } = data;

  const query = `
    INSERT INTO subscriptions (
      user_id, stripe_subscription_id, stripe_customer_id,
      plan_name, plan_amount, plan_interval, status,
      current_period_start, current_period_end
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const values = [
    user_id,
    stripe_subscription_id,
    stripe_customer_id,
    plan_name,
    plan_amount,
    plan_interval,
    status,
    current_period_start,
    current_period_end
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getUserActiveSubscription = async (userId) => {
  const query = `
    SELECT * FROM subscriptions 
    WHERE user_id = $1 AND status IN ('active', 'trialing')
    ORDER BY created_at DESC 
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows[0];
};

export const getSubscriptionByStripeId = async (stripeSubId) => {
  const query = `SELECT * FROM subscriptions WHERE stripe_subscription_id = $1;`;
  const { rows } = await pool.query(query, [stripeSubId]);
  return rows[0];
};

export const updateSubscription = async (stripeSubId, data) => {
  const fields = [];
  const values = [];
  let index = 1;

  for (const key in data) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${index}`);
      values.push(data[key]);
      index++;
    }
  }

  if (fields.length === 0) return null;

  const query = `
    UPDATE subscriptions
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE stripe_subscription_id = $${index}
    RETURNING *;
  `;

  values.push(stripeSubId);
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const cancelSubscription = async (stripeSubId) => {
  const query = `
    UPDATE subscriptions
    SET 
      status = 'canceled',
      cancel_at_period_end = true,
      canceled_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE stripe_subscription_id = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [stripeSubId]);
  return rows[0];
};

/* =========================================================
   REFUND CRUD
========================================================= */

export const createRefund = async (data) => {
  const { payment_id, stripe_refund_id, amount, reason, status = 'succeeded' } = data;

  const query = `
    INSERT INTO refunds (payment_id, stripe_refund_id, amount, reason, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [payment_id, stripe_refund_id, amount, reason, status];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getPaymentRefunds = async (paymentId) => {
  const query = `SELECT * FROM refunds WHERE payment_id = $1 ORDER BY created_at DESC;`;
  const { rows } = await pool.query(query, [paymentId]);
  return rows;
};

/* =========================================================
   ADMIN ANALYTICS
========================================================= */

export const getAllPayments = async (options = {}) => {
  const { limit = 100, offset = 0, status = null } = options;

  let query = `
    SELECT p.*, u.name as user_name, u.email as user_email
    FROM payments p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE 1=1
  `;

  const values = [];
  let paramIndex = 1;

  if (status) {
    query += ` AND p.payment_status = $${paramIndex}`;
    values.push(status);
    paramIndex++;
  }

  query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  values.push(limit, offset);

  const { rows } = await pool.query(query, values);
  return rows;
};

export const getPaymentCount = async (status = null) => {
  let query = `SELECT COUNT(*) as count FROM payments`;
  const values = [];

  if (status) {
    query += ` WHERE payment_status = $1`;
    values.push(status);
  }

  const { rows } = await pool.query(query, values);
  return parseInt(rows[0].count);
};

export const getPaymentStats = async (period = 'all') => {
  let dateFilter = '';

  if (period === 'today') {
    dateFilter = `AND created_at >= CURRENT_DATE`;
  } else if (period === 'week') {
    dateFilter = `AND created_at >= CURRENT_DATE - INTERVAL '7 days'`;
  } else if (period === 'month') {
    dateFilter = `AND created_at >= CURRENT_DATE - INTERVAL '30 days'`;
  }

  const query = `
    SELECT 
      COUNT(*) as total_payments,
      COALESCE(SUM(CASE WHEN payment_status = 'succeeded' THEN amount ELSE 0 END), 0) as total_revenue,
      COUNT(CASE WHEN payment_status = 'succeeded' THEN 1 END) as successful_payments,
      COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
      COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_payments,
      COALESCE(AVG(CASE WHEN payment_status = 'succeeded' THEN amount END), 0) as average_payment,
      COUNT(DISTINCT user_id) as unique_customers
    FROM payments
    WHERE 1=1 ${dateFilter};
  `;

  const { rows } = await pool.query(query);
  
  const stats = rows[0];
  return {
    total_payments: parseInt(stats.total_payments) || 0,
    total_revenue: parseFloat(stats.total_revenue) || 0,
    successful_payments: parseInt(stats.successful_payments) || 0,
    pending_payments: parseInt(stats.pending_payments) || 0,
    failed_payments: parseInt(stats.failed_payments) || 0,
    average_payment: parseFloat(stats.average_payment) || 0,
    unique_customers: parseInt(stats.unique_customers) || 0
  };
};

export const getRevenueByDate = async (days = 30) => {
  const query = `
    SELECT 
      DATE(created_at) as date,
      SUM(CASE WHEN payment_status = 'succeeded' THEN amount ELSE 0 END) as revenue,
      COUNT(CASE WHEN payment_status = 'succeeded' THEN 1 END) as count
    FROM payments
    WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC;
  `;

  const { rows } = await pool.query(query);
  return rows;
};

export const getTopCustomers = async (limit = 10) => {
  const query = `
    SELECT 
      u.id, u.name, u.email,
      COUNT(p.id) as total_orders,
      SUM(CASE WHEN p.payment_status = 'succeeded' THEN p.amount ELSE 0 END) as total_spent
    FROM users u
    JOIN payments p ON u.id = p.user_id
    WHERE p.payment_status = 'succeeded'
    GROUP BY u.id, u.name, u.email
    ORDER BY total_spent DESC
    LIMIT $1;
  `;

  const { rows } = await pool.query(query, [limit]);
  return rows;
};