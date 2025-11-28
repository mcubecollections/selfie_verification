const path = require("path");
const fs = require("fs");

// Determine database type from environment
const DB_TYPE = process.env.DATABASE_URL ? 'postgresql' : 'sqlite';

// Database connection instance
let db;

if (DB_TYPE === 'postgresql') {
  // PostgreSQL configuration
  const { Pool } = require('pg');
  
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });
  
  console.log('Using PostgreSQL database');
  
  // Test connection
  db.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('PostgreSQL connection error:', err.message);
      throw err;
    }
    console.log('Connected to PostgreSQL database');
  });
  
} else {
  // SQLite configuration
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'verifications.db');
  const dbDir = path.dirname(dbPath);
  
  // Ensure database directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  console.log(`Using SQLite database at: ${dbPath}`);
  
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database connection error:', err.message);
      throw err;
    }
    console.log('Connected to SQLite database');
  });
}

// Initialize database tables
async function initializeDatabase() {
  if (DB_TYPE === 'postgresql') {
    // PostgreSQL table creation
    await db.query(`
      CREATE TABLE IF NOT EXISTS verifications (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        pin_number VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        code VARCHAR(50),
        verified VARCHAR(50),
        transaction_guid VARCHAR(255),
        person_data TEXT,
        request_data TEXT,
        response_data TEXT,
        cloudinary_url VARCHAR(500),
        progress_step INTEGER DEFAULT 0,
        progress_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add new columns if they don't exist (for existing databases)
    await db.query(`
      ALTER TABLE verifications 
      ADD COLUMN IF NOT EXISTS cloudinary_url VARCHAR(500),
      ADD COLUMN IF NOT EXISTS progress_step INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS progress_data TEXT
    `).catch(() => {
      // Columns might already exist, ignore error
    });
    
    await db.query(`CREATE INDEX IF NOT EXISTS idx_session_id ON verifications(session_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_email ON verifications(email)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_status ON verifications(status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_created_at ON verifications(created_at DESC)`);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('PostgreSQL tables initialized');
  } else {
    // SQLite table creation
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS verifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          pin_number TEXT NOT NULL,
          status TEXT NOT NULL,
          code TEXT,
          verified TEXT,
          transaction_guid TEXT,
          person_data TEXT,
          request_data TEXT,
          response_data TEXT,
          cloudinary_url TEXT,
          progress_step INTEGER DEFAULT 0,
          progress_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add new columns if they don't exist (for existing databases)
      db.run(`ALTER TABLE verifications ADD COLUMN cloudinary_url TEXT`, () => {});
      db.run(`ALTER TABLE verifications ADD COLUMN progress_step INTEGER DEFAULT 0`, () => {});
      db.run(`ALTER TABLE verifications ADD COLUMN progress_data TEXT`, () => {});
      
      db.run(`CREATE INDEX IF NOT EXISTS idx_session_id ON verifications(session_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_email ON verifications(email)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_status ON verifications(status)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON verifications(created_at DESC)`);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });
    
    console.log('SQLite tables initialized');
  }
}

// Database initialization will be called explicitly from server.js

function createVerification({
  sessionId,
  name,
  email,
  pinNumber,
  status,
  code,
  verified,
  transactionGuid,
  personData,
  requestData,
  responseData,
  cloudinaryUrl,
}) {
  return new Promise((resolve, reject) => {
    const values = [
      sessionId,
      name || "",
      email || "",
      pinNumber || "",
      status,
      code || null,
      verified || null,
      transactionGuid || null,
      personData ? JSON.stringify(personData) : null,
      requestData ? JSON.stringify(requestData) : null,
      responseData ? JSON.stringify(responseData) : null,
      cloudinaryUrl || null,
    ];
    
    if (DB_TYPE === 'postgresql') {
      db.query(
        `INSERT INTO verifications (
          session_id, name, email, pin_number, status, code, verified,
          transaction_guid, person_data, request_data, response_data, cloudinary_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        values,
        (err, result) => {
          if (err) return reject(err);
          resolve(result.rows[0].id);
        }
      );
    } else {
      db.run(
        `INSERT INTO verifications (
          session_id, name, email, pin_number, status, code, verified,
          transaction_guid, person_data, request_data, response_data, cloudinary_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values,
        function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    }
  });
}

function getVerificationBySessionId(sessionId) {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === 'postgresql') {
      db.query(
        "SELECT * FROM verifications WHERE session_id = $1",
        [sessionId],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.rows[0] || null);
        }
      );
    } else {
      db.get(
        "SELECT * FROM verifications WHERE session_id = ?",
        [sessionId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    }
  });
}

function getAllVerifications(limit = 100, offset = 0) {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === 'postgresql') {
      db.query(
        `SELECT * FROM verifications ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.rows || []);
        }
      );
    } else {
      db.all(
        `SELECT * FROM verifications ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [limit, offset],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    }
  });
}

function getVerificationStats() {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === 'postgresql') {
      db.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COUNT(*) FILTER (WHERE status = 'pending') as pending
        FROM verifications`,
        (err, result) => {
          if (err) return reject(err);
          const row = result.rows[0];
          resolve({
            total: parseInt(row.total) || 0,
            approved: parseInt(row.approved) || 0,
            failed: parseInt(row.failed) || 0,
            pending: parseInt(row.pending) || 0,
          });
        }
      );
    } else {
      db.get("SELECT COUNT(*) as total FROM verifications", (err, row1) => {
        if (err) return reject(err);
        db.get(
          "SELECT COUNT(*) as approved FROM verifications WHERE status = 'approved'",
          (err, row2) => {
            if (err) return reject(err);
            db.get(
              "SELECT COUNT(*) as failed FROM verifications WHERE status = 'failed'",
              (err, row3) => {
                if (err) return reject(err);
                db.get(
                  "SELECT COUNT(*) as pending FROM verifications WHERE status = 'pending'",
                  (err, row4) => {
                    if (err) return reject(err);
                    resolve({
                      total: row1?.total || 0,
                      approved: row2?.approved || 0,
                      failed: row3?.failed || 0,
                      pending: row4?.pending || 0,
                    });
                  }
                );
              }
            );
          }
        );
      });
    }
  });
}

function searchVerifications(query) {
  return new Promise((resolve, reject) => {
    const searchTerm = `%${query}%`;
    
    if (DB_TYPE === 'postgresql') {
      db.query(
        `SELECT * FROM verifications WHERE name ILIKE $1 OR email ILIKE $2 OR pin_number ILIKE $3 ORDER BY created_at DESC LIMIT 50`,
        [searchTerm, searchTerm, searchTerm],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.rows || []);
        }
      );
    } else {
      db.all(
        `SELECT * FROM verifications WHERE name LIKE ? OR email LIKE ? OR pin_number LIKE ? ORDER BY created_at DESC LIMIT 50`,
        [searchTerm, searchTerm, searchTerm],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    }
  });
}

function getAdminByUsername(username) {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === 'postgresql') {
      db.query(
        "SELECT * FROM admin_users WHERE username = $1",
        [username],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.rows[0] || null);
        }
      );
    } else {
      db.get(
        "SELECT * FROM admin_users WHERE username = ?",
        [username],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    }
  });
}

function createAdminUser(username, passwordHash) {
  return new Promise((resolve, reject) => {
    if (DB_TYPE === 'postgresql') {
      db.query(
        "INSERT INTO admin_users (username, password_hash) VALUES ($1, $2) RETURNING id",
        [username, passwordHash],
        (err, result) => {
          if (err) return reject(err);
          resolve(result.rows[0].id);
        }
      );
    } else {
      db.run(
        "INSERT INTO admin_users (username, password_hash) VALUES (?, ?)",
        [username, passwordHash],
        function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    }
  });
}

module.exports = {
  db,
  initializeDatabase,
  createVerification,
  getVerificationBySessionId,
  getAllVerifications,
  getVerificationStats,
  searchVerifications,
  getAdminByUsername,
  createAdminUser,
};
