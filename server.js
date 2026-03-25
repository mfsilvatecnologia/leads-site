import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';
import fs from 'fs';

// ES modules don't have __dirname, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Secure download endpoint
app.post('/api/secure-download', (req, res) => {
  // Check for security header
  const secureHeader = req.headers['x-secure-request'];
  if (!secureHeader || secureHeader !== 'true') {
    return res.status(403).send('Unauthorized access');
  }

  // Path to the extension file (not accessible via direct URL)
  const filePath = path.join(__dirname, 'src', 'assets', 'extension', 'extencao-disparo-rapido.zip');

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  // Set headers for download
  res.setHeader('Content-Disposition', 'attachment; filename=extencao-disparo-rapido.zip');
  res.setHeader('Content-Type', 'application/zip');
  
  // Send the file
  res.sendFile(filePath);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
