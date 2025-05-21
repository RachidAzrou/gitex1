const express = require('express');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');

// Laad omgevingsvariabelen uit .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Database setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database initialisatie
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gitex_leads (
        id SERIAL PRIMARY KEY,
        company VARCHAR(255),
        contact_person VARCHAR(255),
        email VARCHAR(255),
        photo_paths TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ GITEX leads table ready');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Set up multer voor bestandsuploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'gitex-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limiet
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

// API Routes
// GET alle leads
app.get('/api/gitex-leads', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gitex_leads ORDER BY created_at DESC');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads'
    });
  }
});

// GET foto's voor een specifieke lead
app.get('/api/gitex-leads/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT photo_paths FROM gitex_leads WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    const photoPaths = result.rows[0].photo_paths || [];
    const photoUrls = photoPaths.map(filename => {
      return `/api/uploads/${filename}`;
    });
    
    res.json({
      success: true,
      data: {
        photoUrls
      }
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch photos'
    });
  }
});

// POST nieuwe lead
app.post('/api/gitex-leads', upload.array('photos', 5), async (req, res) => {
  try {
    const { company, contactPerson, email } = req.body;
    const files = req.files || [];

    // Verzamel de bestandsnamen
    const photoPaths = files.map(file => path.basename(file.path));

    // Voeg de lead toe aan de database
    const result = await pool.query(
      'INSERT INTO gitex_leads (company, contact_person, email, photo_paths) VALUES ($1, $2, $3, $4) RETURNING *',
      [company || null, contactPerson || null, email || null, photoPaths]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create lead'
    });
  }
});

// Serving uploaded files
app.use('/api/uploads', express.static(uploadsDir));

// In productie, serveer de statische bestanden van de React app
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../dist');
  app.use(express.static(clientBuildPath));
  
  // Alle niet-API routes worden doorgestuurd naar de React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Start de server
(async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
})();