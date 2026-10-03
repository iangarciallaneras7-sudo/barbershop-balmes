const L = require('./_lib');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const id = String((req.body || {}).id || '').trim().toUpperCase();
  const last9 = s => String(s || '').replace(/\D/g, '').slice(-9);
  const bk = await L.redis.get('bk:' + id);
  if (!bk || last9(bk.phone) !== last9(req.body.phone)) return res.status(404).json({ error: 'no' });
  await L.redis.hdel(L.bkey(bk.barber, bk.date), ...bk.units);
  await L.redis.del('bk:' + id);
  await L.redis.srem('day:' + bk.date, id);
  res.json({ ok: true });
};
