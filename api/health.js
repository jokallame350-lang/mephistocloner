module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-byok-keys');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    status: 'ok',
    version: '2.5.0-pro',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    chromeAvailable: false,
    chromePath: 'Vercel Serverless Runtime',
    platform: 'vercel-cloud'
  });
};
