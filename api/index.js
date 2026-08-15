let app;
let initError = null;

try {
  app = require('../server');
} catch (err) {
  initError = err;
}

module.exports = (req, res) => {
  if (initError) {
    return res.status(500).json({
      success: false,
      error: 'Initialization Error',
      message: initError.message,
      stack: initError.stack
    });
  }

  // If Vercel rewrote /api/xyz to /xyz, prepend /api so Express routes match
  if (req.url && !req.url.startsWith('/api') && req.url !== '/') {
    req.url = '/api' + req.url;
  }

  return app(req, res);
};
