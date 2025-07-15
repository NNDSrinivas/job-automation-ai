const express = require('express');
const path = require('path');
const app = express();
const port = 5173;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Job Automation AI running on http://localhost:${port}`);
  console.log('📦 Serving SPA with React Router support');
});
