const L = require('./_lib');
module.exports = async (req, res) => {
  if (!process.env.ADMIN_PASSWORD || req.headers['x-admin'] !== process.env.ADMIN_PASSWORD) return res.status(401).end();
  if (req.method === 'POST') { // cancelar una cita desde el panel
    const bk = await L.redis.get('bk:' + (req.body || {}).id);
    if (!bk) return res.status(404).end();
    await L.redis.hdel(L.bkey(bk.barber, bk.date), ...bk.units);
    await L.redis.del('bk:' + bk.id);
    await L.redis.srem('day:' + bk.date, bk.id);
    return res.json({ ok: true });
  }
  const n = L.now(), out = [];
  for (let i = 0; i < 14; i++) { // citas de los próximos 14 días
    const d = new Date(n.date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + i);
    const ids = (await L.redis.smembers('day:' + d.toISOString().slice(0, 10))) || [];
    (await Promise.all(ids.map(x => L.redis.get('bk:' + x)))).filter(Boolean).forEach(b => out.push(b));
  }
  res.json(out.sort((a, b) => a.date.localeCompare(b.date) || a.time - b.time));
};
