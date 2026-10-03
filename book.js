const L = require('./_lib');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const b = req.body || {}, svc = L.SERVICES[b.service];
  const name = String(b.name || '').trim().slice(0, 60);
  const phone = String(b.phone || '').replace(/[^\d+]/g, '').slice(0, 16);
  const time = Math.round(+b.time);
  if (!L.BARBERS[b.barber] || !svc || !name || phone.length < 9) return res.status(400).json({ error: 'datos' });
  if (!(await L.slotList(b.barber, b.date, svc.m)).includes(time)) return res.status(409).json({ error: 'taken' });
  const id = Math.random().toString(36).slice(2, 8).toUpperCase(), key = L.bkey(b.barber, b.date), got = [];
  for (const u of L.units(time, svc.m)) {
    if (await L.redis.hsetnx(key, u, id)) got.push(u);
    else { if (got.length) await L.redis.hdel(key, ...got); return res.status(409).json({ error: 'taken' }); }
  }
  await L.redis.set('bk:' + id, { id, barber: +b.barber, service: +b.service, date: b.date, time, name, phone, units: got });
  await L.redis.sadd('day:' + b.date, id);
  res.json({ id });
};
