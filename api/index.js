const { TERMS_HTML, PRIVACY_HTML, REFUND_HTML, PRICING_HTML } = require('../lib/legal-pages');
const app = require('../server');

module.exports = (req, res) => {
  const url = (req.url || '').toLowerCase();
  if (url.includes('terms')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(TERMS_HTML);
  }
  if (url.includes('privacy')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(PRIVACY_HTML);
  }
  if (url.includes('refund')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(REFUND_HTML);
  }
  if (url.includes('pricing') && !url.includes('/api/billing/plans')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(PRICING_HTML);
  }
  return app(req, res);
};
