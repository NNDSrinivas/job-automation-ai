const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Handle React Router routes by serving index.html for all non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  console.log(`Serving index.html for route: ${req.url}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
});

app.listen(PORT, () => {
  console.log(`
  ┌───────────────────────────────────────────┐
  │                                           │
  │   Job Automation AI - Production Ready    │
  │                                           │
  │   - Frontend:  http://localhost:${PORT}      │
  │   - Backend:   http://localhost:8000      │
  │   - API Docs:  http://localhost:8000/docs │
  │                                           │
  │   🚀 Application ready for use!           │
  │                                           │
  └───────────────────────────────────────────┘
  `);
});
