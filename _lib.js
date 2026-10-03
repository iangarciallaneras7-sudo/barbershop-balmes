const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});
// CONFIGURACIÓN: debe coincidir con index.html
const BARBERS = ['Sufian', 'Primo de Sufian'];
const SERVICES = [{ n: 'Corte de pelo', m: 30 }, { n: 'Corte con barba', m: 40 }];
const RANGES = [[570, 840], [960, 1260]]; // minutos: 9:30-14:00 y 16:00-21:00
const CLOSED_DAY = 0, STEP = 30, UNIT = 10, MAX_DAYS = 30;

function now() {
  const [date, t] = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Madrid' }).split(' ');
  const [h, m] = t.split(':');
  return { date, min: +h * 60 + +m };
}
const bkey = (b, d) => `busy:${b}:${d}`;
const units = (s, dur) => { const a = []; for (let t = s; t < s + dur; t += UNIT) a.push(t); return a; };

async function slotList(barber, date, dur) {
  if (!BARBERS[barber] || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  const n = now(), d = new Date(date + 'T12:00:00Z');
  if (isNaN(d) || d.getUTCDay() === CLOSED_DAY || date < n.date) return [];
  if ((d - new Date(n.date + 'T12:00:00Z')) / 864e5 > MAX_DAYS) return [];
  const busy = (await redis.hgetall(bkey(barber, date))) || {};
  const out = [];
  for (const [a, b] of RANGES)
    for (let t = a; t + dur <= b; t += STEP) {
      if (date === n.date && t <= n.min + 15) continue;
      if (units(t, dur).every(u => !(u in busy))) out.push(t);
    }
  return out;
}
module.exports = { now, redis, BARBERS, SERVICES, bkey, units, slotList };
