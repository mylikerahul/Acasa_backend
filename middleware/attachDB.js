import pool from '../config/db.js';

const attachDB = (req, res, next) => {
  req.db = pool;
  next();
};

export default attachDB;