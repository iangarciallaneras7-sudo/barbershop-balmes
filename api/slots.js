const L = require('./_lib');
module.exports = async (req, res) => {
  const svc = L.SERVICES[+req.query.service];
  if (!svc) return res.status(400).json({ error: 'servicio' });
  res.json({ slots: await L.slotList(+req.query.barber, req.query.date, svc.m) });
};
