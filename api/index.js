const { TERMS_HTML, PRIVACY_HTML, REFUND_HTML, PRICING_HTML } = require('../lib/legal-pages');
const app = require('../server');

module.exports = (req, res) => {
  const url = (req.url || '').toLowerCase();
  if (url.includes('terms')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(TERMS_HTML);
  }
  if (url.includes('privacy')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(PRIVACY_HTML);
  }
  if (url.includes('refund')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(REFUND_HTML);
  }
  if (url.includes('pricing') && !url.includes('/api/billing/plans')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(PRICING_HTML);
  }
  return app(req, res);
};
