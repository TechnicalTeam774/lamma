/* ===== لمّة — كورة الأساطير: محرك الماتش (فيزيا + رسم + كمبيوتر) =====
   ملف لوحده بيتحمّل بس لما حد يفتح قسم الكورة.
   كل اللعيبة شخصيات أصلية من عندنا — مش لعيبة حقيقيين. */
(function (root) {
'use strict';

/* ---------- الملعب ---------- */
var FW = 1000, FH = 560, GY = 486;                 // الأرض
var GOAL_W = 84, GOAL_H = 168, BAR_Y = GY - GOAL_H, BAR_T = 11;
var GRAV = 1900, BALL_R = 19, MAX_BALL = 1750;
var MATCH_T = 90;

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

/* ---------- القوى الخاصة ---------- */
var SUPERS = {
  fire:    { ic: '🔥', ar: 'ضربة نار', en: 'Fire shot', dAr: 'الشوطة الجاية بتطلع نار، ولو خبطت الخصم بتوقّعه', dEn: 'Your next shot burns, and knocks the opponent down' },
  freeze:  { ic: '❄️', ar: 'تجميد', en: 'Freeze', dAr: 'بيجمّد اللي قدامك كام ثانية', dEn: 'Freezes your opponent for a few seconds' },
  giant:   { ic: '🗿', ar: 'راس عملاقة', en: 'Giant head', dAr: 'راسك بتكبر وتقفل المرمى', dEn: 'Your head grows huge' },
  bolt:    { ic: '⚡', ar: 'برق', en: 'Lightning', dAr: 'سرعة ونطّ زيادة', dEn: 'Extra speed and jump' },
  wall:    { ic: '🧱', ar: 'حيطة', en: 'Wall', dAr: 'حيطة قدام مرماك', dEn: 'A wall in front of your goal' },
  twister: { ic: '🌪️', ar: 'إعصار', en: 'Twister', dAr: 'الكورة بتلف وتطير على مرمى الخصم', dEn: 'The ball spins toward their goal' },
  magnet:  { ic: '🧲', ar: 'مغناطيس', en: 'Magnet', dAr: 'الكورة بتلزق في رجلك', dEn: 'The ball sticks to your foot' },
  shrink:  { ic: '🐜', ar: 'تصغير', en: 'Shrink', dAr: 'الخصم بيصغر ومبيعرفش ينط', dEn: 'Your opponent shrinks' },
  quake:   { ic: '💥', ar: 'زلزال', en: 'Quake', dAr: 'بتخبط الأرض والخصم بيدوخ', dEn: 'Stomp: your opponent gets dizzy' }
};

/* ---------- اللعيبة (أصلية) ----------
   st: سرعة spd / نط jmp / شوطة sht / راس hed (من 10)، والترقية بتزود لحد +5 */
var CHARS = [
  // مبتدئين
  { id: 'hamo', ar: 'حمّو', en: 'Hamo', tier: 0, price: 0, sup: 'fire', st: { spd: 5, jmp: 5, sht: 5, hed: 5 },
    look: { skin: '#e8b48a', hair: 'short', hc: '#2b1d14', beard: 0, shirt: '#e23b3b', trim: '#ffffff', shorts: '#1d1d2b', boots: '#111' } },
  { id: 'asfour', ar: 'عصفور', en: 'Asfour', tier: 0, price: 600, sup: 'bolt', st: { spd: 6, jmp: 8, sht: 4, hed: 5 },
    look: { skin: '#f2c7a5', hair: 'spiky', hc: '#e0a526', beard: 0, shirt: '#f2c94c', trim: '#1b6b3a', shorts: '#1b6b3a', boots: '#e23b3b' } },
  { id: 'dozer', ar: 'بلدوزر', en: 'Dozer', tier: 0, price: 800, sup: 'quake', st: { spd: 3, jmp: 4, sht: 8, hed: 6 },
    look: { skin: '#9c6a43', hair: 'bald', hc: '#000', beard: 2, shirt: '#3a3f4b', trim: '#f2994a', shorts: '#f2994a', boots: '#222' } },
  { id: 'hita', ar: 'الحيطة', en: 'The Wall', tier: 0, price: 900, sup: 'wall', st: { spd: 4, jmp: 5, sht: 5, hed: 8 },
    look: { skin: '#c68a5e', hair: 'buzz', hc: '#1a1a1a', beard: 1, shirt: '#2d7dd2', trim: '#ffffff', shorts: '#ffffff', boots: '#2d7dd2' } },
  // محترفين
  { id: 'bar2', ar: 'البرق', en: 'Flash', tier: 1, price: 2200, sup: 'bolt', st: { spd: 9, jmp: 6, sht: 6, hed: 5 },
    look: { skin: '#6e4a2e', hair: 'mohawk', hc: '#f2c94c', beard: 0, shirt: '#111827', trim: '#f2c94c', shorts: '#111827', boots: '#f2c94c' } },
  { id: 'hawy', ar: 'الحاوي', en: 'Trickster', tier: 1, price: 2600, sup: 'twister', st: { spd: 7, jmp: 6, sht: 7, hed: 6 },
    look: { skin: '#e0ac83', hair: 'curly', hc: '#3b2412', beard: 3, shirt: '#7b2cbf', trim: '#f2c94c', shorts: '#2a0e45', boots: '#fff' } },
  { id: 'madfa3', ar: 'المدفع', en: 'Cannon', tier: 1, price: 3000, sup: 'fire', st: { spd: 5, jmp: 6, sht: 10, hed: 6 },
    look: { skin: '#f2c7a5', hair: 'long', hc: '#5a3a22', band: '#e23b3b', beard: 2, shirt: '#e23b3b', trim: '#111', shorts: '#111', boots: '#f2c94c' } },
  { id: 'nesr', ar: 'النسر', en: 'Eagle', tier: 1, price: 3200, sup: 'giant', st: { spd: 6, jmp: 10, sht: 6, hed: 8 },
    look: { skin: '#c68a5e', hair: 'afro', hc: '#1a1a1a', beard: 0, shirt: '#14967f', trim: '#ffffff', shorts: '#0b4f43', boots: '#fff' } },
  // أساطير — الأقوى والأغلى
  { id: 'sa7er', ar: 'الساحر', en: 'The Wizard', tier: 2, price: 7500, sup: 'magnet', st: { spd: 9, jmp: 8, sht: 9, hed: 8 },
    look: { skin: '#e8b48a', hair: 'long', hc: '#2b1d14', band: '#f2c94c', beard: 3, shirt: '#0f5ea8', trim: '#f2c94c', shorts: '#0b2d55', boots: '#f2c94c' } },
  { id: 'maestro', ar: 'المايسترو', en: 'Maestro', tier: 2, price: 8000, sup: 'freeze', st: { spd: 8, jmp: 8, sht: 9, hed: 9 },
    look: { skin: '#f2c7a5', hair: 'bald', hc: '#000', beard: 1, shirt: '#ffffff', trim: '#0f5ea8', shorts: '#0f5ea8', boots: '#111' } },
  { id: 'emperor', ar: 'الإمبراطور', en: 'The Emperor', tier: 2, price: 9000, sup: 'giant', st: { spd: 8, jmp: 9, sht: 10, hed: 9 },
    look: { skin: '#9c6a43', hair: 'curly', hc: '#111', beard: 0, shirt: '#f2c94c', trim: '#1b6b3a', shorts: '#1b6b3a', boots: '#fff' } },
  { id: 'legend', ar: 'الأسطورة', en: 'The Legend', tier: 2, price: 12000, sup: 'twister', st: { spd: 10, jmp: 9, sht: 10, hed: 10 },
    look: { skin: '#6e4a2e', hair: 'spiky', hc: '#111', beard: 2, shirt: '#111827', trim: '#e2b33c', shorts: '#e2b33c', boots: '#e2b33c' } }
];
var CHAR = {}; CHARS.forEach(function (c) { CHAR[c.id] = c; });

/** الأرقام الفعلية من المستوى والترقيات (up: {spd,jmp,sht,hed,sup}) */
function params(ch, up) {
  up = up || {};
  var s = function (k) { return ch.st[k] + (up[k] || 0); };
  return { speed: 250 + s('spd') * 20, jump: 640 + s('jmp') * 28, shot: 520 + s('sht') * 40,
           head: 0.45 + s('hed') * 0.08, headR: 35, supLv: up.sup || 0 };
}
function rating(ch, up) {      // التقييم العام من 100
  up = up || {}; var t = 0;
  ['spd', 'jmp', 'sht', 'hed'].forEach(function (k) { t += ch.st[k] + (up[k] || 0); });
  return Math.round(40 + t * 1.25 + (up.sup || 0) * 1.5);
}

/* ---------- اللاعب ---------- */
function Player(side, ch, up) {
  this.side = side; this.f = side === 0 ? 1 : -1; this.ch = ch; this.P = params(ch, up);
  this.reset(); this.sup = 0; this.fx = {}; this.goals = 0; this.touches = 0;
}
Player.prototype.reset = function () {
  this.x = this.side === 0 ? FW * 0.27 : FW * 0.73; this.y = GY; this.vx = 0; this.vy = 0;
  this.ground = true; this.kickT = 0; this.kickHit = false; this.stun = 0; this.mood = 0;
};
Player.prototype.headR = function () {
  var r = this.P.headR; if (this.fx.giant > 0) r *= 1.7; if (this.fx.shrink > 0) r *= 0.62; return r;
};
Player.prototype.scale = function () { return this.fx.shrink > 0 ? 0.72 : 1; };
Player.prototype.headY = function () { return this.y - 78 * this.scale() - this.headR() * 0.8; };
Player.prototype.frozen = function () { return this.fx.freeze > 0 || this.stun > 0; };
Player.prototype.update = function (dt, inp) {
  var spd = this.P.speed, jmp = this.P.jump;
  if (this.fx.bolt > 0) { spd *= 1.55; jmp *= 1.15; }
  if (this.fx.shrink > 0) { spd *= 0.85; jmp *= 0.78; }
  var want = this.frozen() ? 0 : ((inp.r ? 1 : 0) - (inp.l ? 1 : 0)) * spd;
  this.vx += (want - this.vx) * Math.min(1, dt * (this.ground ? 16 : 7));
  if (inp.jump && this.ground && !this.frozen()) { this.vy = -jmp; this.ground = false; this.jumped = true; }
  if (inp.kick && this.kickT <= 0 && !this.frozen()) { this.kickT = 0.3; this.kickHit = false; this.hitDone = false; this.kicked = true; }
  this.vy += GRAV * dt; this.x += this.vx * dt; this.y += this.vy * dt;
  if (this.y >= GY) { this.y = GY; this.vy = 0; this.ground = true; }
  this.x = clamp(this.x, 24, FW - 24);
  // العارضة بتقفل النطّ جوه المرمى
  var inGoal = this.x < GOAL_W + 6 || this.x > FW - GOAL_W - 6, top = this.headY() - this.headR();
  if (inGoal && this.vy < 0 && top < BAR_Y + BAR_T && this.y > BAR_Y + 40) { this.vy = 0; }
  if (this.kickT > 0) this.kickT -= dt;
  if (this.stun > 0) this.stun -= dt;
  for (var k in this.fx) if (this.fx[k] > 0) this.fx[k] -= dt;
  if (this.mood > 0) this.mood -= dt;
};

/* ---------- العالم (من غير رسم: نفس الكود للماتش وللاختبار) ---------- */
function World(o) {
  this.rnd = o.rnd || Math.random;
  this.p = [new Player(0, o.c1, o.u1), new Player(1, o.c2, o.u2)];
  this.time = o.time || MATCH_T; this.score = [0, 0];
  this.ball = { x: FW / 2, y: 160, vx: 0, vy: 0, spin: 0, fire: 0, twist: 0, tside: 0, last: -1 };
  this.state = 'count'; this.stT = 2.2; this.events = []; this.shake = 0; this.lastGoal = -1;
  this.kickoff(-1);
}
World.prototype.kickoff = function (conceded) {
  var b = this.ball; b.x = FW / 2 + (conceded === 0 ? -40 : conceded === 1 ? 40 : 0); b.y = 150; b.vx = 0; b.vy = 0; b.fire = 0; b.twist = 0;
  this.p.forEach(function (p) { p.reset(); });
};
World.prototype.ev = function (n, a) { this.events.push({ n: n, a: a }); };
World.prototype.useSuper = function (i) {
  var p = this.p[i], o = this.p[1 - i], lv = p.P.supLv, b = this.ball;
  if (p.sup < 100 || this.state !== 'play' || p.frozen()) return false;
  p.sup = 0; p.mood = 1.2;
  switch (p.ch.sup) {
    case 'fire': p.fx.fire = 6 + lv; break;
    case 'freeze': o.fx.freeze = 2.1 + lv * 0.3; break;
    case 'giant': p.fx.giant = 6 + lv; break;
    case 'bolt': p.fx.bolt = 5 + lv * 0.6; break;
    case 'wall': p.fx.wall = 5 + lv * 0.8; break;
    case 'twister': b.twist = 1.25 + lv * 0.08; b.tside = i; b.tT = 0; b.last = i; break;
    case 'magnet': p.fx.magnet = 3 + lv * 0.4; break;
    case 'shrink': o.fx.shrink = 5 + lv * 0.6; break;
    case 'quake': this.shake = 0.5; if (o.ground) o.stun = 1.3 + lv * 0.2; if (b.y > GY - 80) b.vy = -760; break;
  }
  this.ev('super', { i: i, s: p.ch.sup });
  return true;
};
World.prototype.step = function (dt, inputs) {
  var self = this, b = this.ball;
  if (this.shake > 0) this.shake -= dt;
  if (this.state === 'count') { this.stT -= dt; if (this.stT <= 0) { this.state = 'play'; this.ev('whistle'); } }
  else if (this.state === 'goal') { this.stT -= dt; this.p.forEach(function (p, i) { p.update(dt, {}); }); this.ballPhys(dt); if (this.stT <= 0) { this.kickoff(this.lastGoal === 0 ? 1 : 0); this.state = this.time > 0 ? 'count' : 'end'; this.stT = 1.2; if (this.state === 'end') this.ev('end'); } return; }
  else if (this.state === 'end') return;
  var play = this.state === 'play';
  this.p.forEach(function (p, i) {
    var inp = play ? (inputs[i] || {}) : {};
    if (inp.sup) self.useSuper(i);
    p.update(dt, inp);
    if (play) p.sup = Math.min(100, p.sup + dt * 7.2);
  });
  if (!play) return;
  this.time -= dt;
  // لاعب في لاعب: محدش يعدّي جوه التاني
  var a = this.p[0], c = this.p[1], dx = c.x - a.x, minD = 46;
  if (Math.abs(dx) < minD && Math.abs(a.y - c.y) < 80) { var push = (minD - Math.abs(dx)) / 2 * (dx >= 0 ? 1 : -1); a.x -= push; c.x += push; }
  this.ballPhys(dt);
  this.fr = (this.fr || 0) + 1;
  if (this.fr % 2) { this.touch(this.p[0], 0); this.touch(this.p[1], 1); } else { this.touch(this.p[1], 1); this.touch(this.p[0], 0); }
  this.goalCheck();
  if (this.time <= 0 && this.state === 'play') { this.time = 0; this.state = 'end'; this.ev('end'); }
};
World.prototype.ballPhys = function (dt) {
  var b = this.ball, n = 3, h = dt / n;
  for (var s = 0; s < n; s++) {
    if (b.twist > 0) {                         // إعصار: الكورة بتمشي متموّجة على مرمى الخصم
      b.twist -= h; b.tT = (b.tT || 0) + h;
      var f = b.tside === 0 ? 1 : -1;
      b.vx = f * 760; b.vy = Math.sin(b.tT * 13) * 420 - 40;
    } else { b.vy += GRAV * 0.9 * h; }
    b.vx *= 1 - 0.1 * h; b.x += b.vx * h; b.y += b.vy * h; b.spin += b.vx * h / BALL_R;
    if (b.y > GY - BALL_R) { b.y = GY - BALL_R; if (b.vy > 0) { if (b.vy > 220) this.ev('bounce', Math.min(1, b.vy / 900)); b.vy = -b.vy * 0.66; } if (Math.abs(b.vy) < 70) b.vy = 0; b.vx *= Math.pow(0.25, h); }
    if (b.y < BALL_R) { b.y = BALL_R; b.vy = Math.abs(b.vy) * 0.7; }
    if (b.x < BALL_R) { b.x = BALL_R; b.vx = Math.abs(b.vx) * 0.65; }
    if (b.x > FW - BALL_R) { b.x = FW - BALL_R; b.vx = -Math.abs(b.vx) * 0.65; }
    if (circRect(b, 0, BAR_Y, GOAL_W, BAR_Y + BAR_T, 0.55)) this.ev('post');
    if (circRect(b, FW - GOAL_W, BAR_Y, FW, BAR_Y + BAR_T, 0.55)) this.ev('post');
    for (var i = 0; i < 2; i++) {               // الحيطة
      var p = this.p[i];
      if (p.fx.wall > 0) { var wx = i === 0 ? GOAL_W + 8 : FW - GOAL_W - 26; if (circRect(b, wx, GY - 225, wx + 18, GY, 0.75)) { b.twist = 0; } }
      if (p.fx.magnet > 0) {                   // مغناطيس: الكورة بتنجذب لرجلك
        var mx = p.x + p.f * 34, my = p.y - 20, ddx = mx - b.x, ddy = my - b.y, d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < 260 && d > 1) { b.vx += ddx / d * 2600 * h; b.vy += ddy / d * 2600 * h; b.vx *= 1 - 3 * h; b.vy *= 1 - 3 * h; }
      }
    }
  }
  var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy); if (sp > MAX_BALL) { b.vx *= MAX_BALL / sp; b.vy *= MAX_BALL / sp; }
  if (b.fire > 0) b.fire -= dt;
};
function circRect(b, x0, y0, x1, y1, e) {
  var cx = clamp(b.x, x0, x1), cy = clamp(b.y, y0, y1), dx = b.x - cx, dy = b.y - cy, d2 = dx * dx + dy * dy;
  if (d2 >= BALL_R * BALL_R) return false;
  var d = Math.sqrt(d2), nx, ny;
  if (d < 0.001) { nx = 0; ny = b.y < (y0 + y1) / 2 ? -1 : 1; } else { nx = dx / d; ny = dy / d; }
  b.x = cx + nx * BALL_R; b.y = cy + ny * BALL_R;
  var vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; }
  return true;
}
World.prototype.touch = function (p, i) {
  var b = this.ball, o = this.p[1 - i], hit = false;
  // الراس
  var hx = p.x, hy = p.headY(), r = p.headR() + BALL_R, dx = b.x - hx, dy = b.y - hy, d2 = dx * dx + dy * dy;
  if (d2 < r * r) {
    var d = Math.sqrt(d2) || 0.001, nx = dx / d, ny = dy / d;
    b.x = hx + nx * r; b.y = hy + ny * r;
    var rvx = b.vx - p.vx, rvy = b.vy - p.vy, vn = rvx * nx + rvy * ny;
    if (vn < 0) { b.vx -= 1.75 * vn * nx; b.vy -= 1.75 * vn * ny; }
    var pw = (90 + 110 * p.P.head) * (p.vy < -60 ? 1.45 : 0.7);
    b.vx += nx * pw + p.f * 70 + p.vx * 0.3; b.vy += ny * pw * 0.85 + Math.min(0, p.vy) * 0.2;
    if (b.fire > 0 && b.last !== i) { p.stun = 0.9; p.vx = -p.f * 380; b.vx *= 0.85; this.ev('burn', i); }
    hit = 'head';
  }
  // الجسم
  var s = p.scale();
  if (!hit && circRect(b, p.x - 21 * s, p.y - 80 * s, p.x + 21 * s, p.y, 0.4)) {
    b.vx += p.vx * 0.35; hit = 'body';
    if (b.fire > 0 && b.last !== i) { p.stun = 0.9; p.vx = -p.f * 380; this.ev('burn', i); }
  }
  // الشوطة
  if (p.kickT > 0.13 && !p.kickHit) {
    var fx = p.x + p.f * 32 * s, fy = p.y - 18 * s, kx = b.x - fx, ky = b.y - fy, rr = BALL_R + 26;
    if (kx * kx + ky * ky < rr * rr) {
      var fire = p.fx.fire > 0, high = b.y < p.y - 62 * s;
      var ang = fire ? 0.12 : high ? 0.22 : 0.68, pwr = p.P.shot * (fire ? 1.7 : 1);
      b.vx = p.f * Math.cos(ang) * pwr + p.vx * 0.3; b.vy = -Math.sin(ang) * pwr;
      b.twist = 0; p.kickHit = true; hit = 'kick';
      if (fire) { p.fx.fire = 0; b.fire = 1.3; this.ev('fireshot', i); }
    }
    // الشوطة في الخصم: بيترمي لورا
    if (!p.hitDone && Math.abs(o.x - (p.x + p.f * 30)) < 34 && Math.abs(o.y - p.y) < 50 && !o.frozen()) {
      o.vx = p.f * 430; o.stun = 0.3; p.hitDone = true; this.ev('tackle', i);
    }
  }
  if (hit) {
    b.last = i; p.touches++;
    if (!p.lastTouchT || this.time < p.lastTouchT - 0.25) { p.sup = Math.min(100, p.sup + 5); p.lastTouchT = this.time; this.ev(hit, i); }
  }
};
World.prototype.goalCheck = function () {
  var b = this.ball, who = -1;
  if (b.x + BALL_R < GOAL_W && b.y > BAR_Y + BAR_T) who = 1;
  else if (b.x - BALL_R > FW - GOAL_W && b.y > BAR_Y + BAR_T) who = 0;
  if (who < 0) return;
  this.score[who]++; this.p[who].goals++; this.p[who].mood = 2.5; this.lastGoal = who;
  this.state = 'goal'; this.stT = 1.7; b.twist = 0; this.ev('goal', who);
};

/* ---------- الكمبيوتر ---------- */
var AI_LV = [
  { react: 0.34, err: 85, jumpP: 0.35, kickP: 0.45, superAt: 99, slack: 0.30 },   // سهل
  { react: 0.2, err: 45, jumpP: 0.6, kickP: 0.7, superAt: 0.55, slack: 0.15 },     // متوسط
  { react: 0.11, err: 20, jumpP: 0.85, kickP: 0.9, superAt: 0.3, slack: 0.05 },    // صعب
  { react: 0.05, err: 8, jumpP: 0.97, kickP: 0.97, superAt: 0.15, slack: 0 }        // أسطوري
];
function AI(level, rnd) { this.L = AI_LV[clamp(level | 0, 0, 3)]; this.rnd = rnd || Math.random; this.noise = 0; this.nT = 0; this.wait = 0; this.inp = {}; this.dT = 0; }
function predict(b, t) {   // مكان الكورة بعد t ثانية (تقريبي)
  var x = b.x, y = b.y, vx = b.vx, vy = b.vy, h = 1 / 60;
  for (var s = 0; s < t; s += h) { vy += GRAV * 0.9 * h; x += vx * h; y += vy * h; if (y > GY - BALL_R) { y = GY - BALL_R; vy = -vy * 0.66; } if (x < BALL_R || x > FW - BALL_R) vx = -vx * 0.65; }
  return { x: clamp(x, BALL_R, FW - BALL_R), y: y };
}
AI.prototype.think = function (w, i, dt) {
  var L = this.L, me = w.p[i], op = w.p[1 - i], b = w.ball, f = me.f, R = this.rnd;
  this.dT -= dt;
  if (this.dT > 0) return this.inp;           // بيفكر كل شوية مش كل فريم (ده اللي بيفرق المستويات)
  this.dT = L.react * (0.7 + R() * 0.6);
  this.nT -= this.dT; if (this.nT <= 0) { this.noise = (R() * 2 - 1) * L.err; this.nT = 0.6; }
  var pr = predict(b, L.react + 0.12), ownGoal = i === 0 ? 0 : FW;
  var guard = i === 0 ? GOAL_W + 46 : FW - GOAL_W - 46;            // خط الدفاع قدام المرمى
  var behind = (pr.x - me.x) * f < -6, tx, jumpNow = false;
  var coming = b.vx * f < -90;                                     // الكورة جاية على مرماي
  if (coming) {
    var tt = (guard - b.x) / (b.vx || 1);
    if (tt > 0 && tt < 1.6) {
      var at = predict(b, tt);
      if (at.y > BAR_Y - 30) { tx = guard + f * 6; if (at.y < me.headY() - 4 && tt < 0.42) jumpNow = true; }
    }
  }
  if (tx == null) {
    var myD = Math.abs(pr.x - me.x), opD = Math.abs(pr.x - op.x), myHalf = (pr.x - FW / 2) * f < 0;
    if (behind) tx = pr.x - f * 60;                                 // ارجع ورا الكورة
    else if (opD + 50 < myD) tx = myHalf ? pr.x - f * 55 : guard + (pr.x - guard) * 0.42;   // الخصم أقرب: ارجع اقفل
    else tx = pr.x - f * 24;                                        // هجوم: ادفع الكورة لقدام
  }
  tx = clamp(tx + this.noise, 30, FW - 30);
  var inp = { l: tx < me.x - 10, r: tx > me.x + 10, jump: false, kick: false, sup: false };
  if (R() < L.slack) { inp.l = inp.r = false; }
  var dx = pr.x - me.x, above = pr.y < me.headY() - 6;
  if ((jumpNow || (above && Math.abs(dx) < 80 && pr.y > me.headY() - 250)) && me.ground && R() < L.jumpP) inp.jump = true;
  var fd = (b.x - me.x) * f;
  if (fd > -6 && fd < 78 && b.y > me.y - 120 && R() < L.kickP) inp.kick = true;
  if (me.sup >= 100 && R() < L.superAt * 4 * this.dT + (L.superAt < 1 ? 0.02 : 0)) {
    var attack = (b.x - (FW - ownGoal)) * f < 0 && Math.abs(b.x - (FW - ownGoal)) < 420;
    if (attack || me.ch.sup === 'freeze' || me.ch.sup === 'shrink' || me.ch.sup === 'bolt') inp.sup = true;
  }
  this.inp = inp; return inp;
};

/* ---------- محاكاة من غير رسم (للاختبار وللتحديات بعدين) ---------- */
function simulate(o) {
  var rnd = o.rnd || Math.random, w = new World({ c1: o.c1, c2: o.c2, u1: o.u1, u2: o.u2, time: o.time || MATCH_T, rnd: rnd });
  var a = new AI(o.ai1, rnd), c = new AI(o.ai2, rnd), dt = 1 / 60, n = 0;
  while (w.state !== 'end' && n < 60 * 60 * 6) { w.step(dt, [a.think(w, 0, dt), c.think(w, 1, dt)]); w.events.length = 0; n++; if (!isFinite(w.ball.x) || !isFinite(w.ball.y)) throw new Error('NaN ball'); }
  return { score: w.score.slice(), frames: n, touches: [w.p[0].touches, w.p[1].touches] };
}

/* ======================= الرسم ======================= */
var ARENAS = [
  { ar: 'الشارع', en: 'The Street', sky: ['#ff9a3c', '#ffcf7a', '#6b4b8b'], ground: 'street', crowd: 0 },
  { ar: 'الحارة بالليل', en: 'Night Alley', sky: ['#0b1636', '#1d2b5a', '#3a2a5e'], ground: 'street', crowd: 0, lights: 1 },
  { ar: 'ملعب النادي', en: 'Club Ground', sky: ['#59b7ff', '#9fd6ff', '#d8f0ff'], ground: 'grass', crowd: 1 },
  { ar: 'الاستاد الكبير', en: 'Big Stadium', sky: ['#060b1d', '#101a3a', '#1c2652'], ground: 'grass', crowd: 2, flood: 1 },
  { ar: 'النهائي', en: 'The Final', sky: ['#1a0b2e', '#3b1157', '#7a2a6e'], ground: 'grass', crowd: 3, flood: 1, gold: 1 }
];
function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function seeded(seed) { var s = seed || 7; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

function drawArena(ctx, A, k) {
  var R = seeded(31 + k * 7), g = ctx.createLinearGradient(0, 0, 0, GY);
  g.addColorStop(0, A.sky[2]); g.addColorStop(0.55, A.sky[1]); g.addColorStop(1, A.sky[0]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, FW, FH);
  if (k === 0) { ctx.fillStyle = 'rgba(255,240,190,.9)'; ctx.beginPath(); ctx.arc(820, 250, 46, 0, 7); ctx.fill(); }
  if (A.lights || A.flood) { ctx.fillStyle = 'rgba(255,255,255,.8)'; for (var s = 0; s < 40; s++) { ctx.globalAlpha = 0.3 + R() * 0.7; ctx.fillRect(R() * FW, R() * 200, 2, 2); } ctx.globalAlpha = 1; }
  if (!A.crowd) {   // عمارات
    for (var b = 0; b < 16; b++) {
      var bw = 50 + R() * 60, bh = 80 + R() * 170, bx = b * 66 - 20; ctx.fillStyle = k === 0 ? 'rgba(60,40,70,.85)' : 'rgba(15,18,40,.95)'; ctx.fillRect(bx, GY - 150 - bh, bw, bh + 10);
      ctx.fillStyle = k === 0 ? 'rgba(255,200,120,.35)' : 'rgba(255,210,120,.7)';
      for (var wy = GY - 140 - bh; wy < GY - 160; wy += 16) for (var wx = bx + 6; wx < bx + bw - 8; wx += 14) if (R() < 0.45) ctx.fillRect(wx, wy, 6, 8);
    }
    ctx.fillStyle = k === 0 ? '#5a4b52' : '#22253a'; ctx.fillRect(0, GY - 150, FW, 150);         // سور
    ctx.fillStyle = 'rgba(0,0,0,.18)'; for (var gx = 0; gx < FW; gx += 70) ctx.fillRect(gx, GY - 150, 3, 150);
    if (A.lights) { ctx.strokeStyle = '#2a2d44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 110); ctx.quadraticCurveTo(500, 190, 1000, 110); ctx.stroke(); for (var l = 0; l < 22; l++) { var lx = l * 47 + 10, ly = 110 + Math.sin(l / 21 * Math.PI) * 58; ctx.fillStyle = ['#ffd166', '#ef476f', '#06d6a0', '#118ab2'][l % 4]; ctx.beginPath(); ctx.arc(lx, ly + 6, 5, 0, 7); ctx.fill(); } }
  } else {           // مدرجات وجمهور
    var top = GY - 250; ctx.fillStyle = A.flood ? '#151a33' : '#3a4a6b'; ctx.fillRect(0, top, FW, 210);
    var cols = ['#e23b3b', '#ffffff', '#f2c94c', '#2d7dd2', '#14967f', '#7b2cbf', '#ff8fab'];
    for (var y = top + 10; y < GY - 50; y += 13) for (var x = 4; x < FW; x += 13) { if (R() < 0.9) { ctx.fillStyle = cols[(R() * (A.crowd + 3)) | 0]; ctx.globalAlpha = A.flood ? 0.75 : 0.9; ctx.beginPath(); ctx.arc(x + R() * 4, y + R() * 3, 4.2, 0, 7); ctx.fill(); } }
    ctx.globalAlpha = 1; ctx.fillStyle = A.gold ? '#7a5a12' : '#1d2a44'; ctx.fillRect(0, GY - 52, FW, 52);
    ctx.fillStyle = A.gold ? '#f2c94c' : '#e23b3b'; ctx.font = '900 22px system-ui, sans-serif'; ctx.textAlign = 'center';
    for (var ad = 0; ad < 5; ad++) ctx.fillText(A.gold ? '★ لمّة ★' : 'لمّة', 100 + ad * 200, GY - 19);
    if (A.flood) [80, 920].forEach(function (fx) { var lg = ctx.createRadialGradient(fx, 40, 5, fx, 40, 380); lg.addColorStop(0, 'rgba(255,255,230,.55)'); lg.addColorStop(1, 'rgba(255,255,230,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, FW, GY); ctx.fillStyle = '#fffbe0'; rr(ctx, fx - 40, 24, 80, 26, 6); ctx.fill(); });
  }
  // الأرض
  if (A.ground === 'grass') {
    for (var st = 0; st < 10; st++) { ctx.fillStyle = st % 2 ? '#2f9e4f' : '#38b15b'; ctx.fillRect(st * 100, GY, 100, FH - GY); }
  } else { ctx.fillStyle = k === 0 ? '#6e6a6f' : '#34364a'; ctx.fillRect(0, GY, FW, FH - GY); ctx.fillStyle = 'rgba(0,0,0,.12)'; for (var cr = 0; cr < 30; cr++) ctx.fillRect(R() * FW, GY + R() * 70, 30 + R() * 50, 2); }
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, GY + 2); ctx.lineTo(FW, GY + 2); ctx.moveTo(FW / 2, GY); ctx.lineTo(FW / 2, FH); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(FW / 2, GY + 34, 120, 22, 0, 0, 7); ctx.stroke();
  // ضهر المرمى (الشبكة من ورا)
  [0, 1].forEach(function (s) {
    var x0 = s ? FW - GOAL_W : 0; ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x0, BAR_Y, GOAL_W, GOAL_H);
  });
}
function drawGoalFront(ctx) {
  [0, 1].forEach(function (s) {
    var x0 = s ? FW - GOAL_W : 0, post = s ? FW - GOAL_W : GOAL_W;
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (var y = BAR_Y + 18; y < GY; y += 18) { ctx.moveTo(x0, y); ctx.lineTo(x0 + GOAL_W, y); }
    for (var x = x0 + 14; x < x0 + GOAL_W; x += 14) { ctx.moveTo(x, BAR_Y + BAR_T); ctx.lineTo(x, GY); }
    ctx.stroke();
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(x0, BAR_Y, GOAL_W, BAR_T); ctx.fillRect(post - 5, BAR_Y, 10, GOAL_H);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x0, BAR_Y + BAR_T - 3, GOAL_W, 3);
  });
}
function drawBall(ctx, b) {
  if (b.fire > 0) { for (var k = 1; k < 6; k++) { ctx.globalAlpha = 0.35 - k * 0.05; ctx.fillStyle = k % 2 ? '#ff7b00' : '#ffd000'; ctx.beginPath(); ctx.arc(b.x - b.vx * 0.012 * k, b.y - b.vy * 0.012 * k, BALL_R * (1 - k * 0.1), 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
  if (b.twist > 0) { ctx.strokeStyle = 'rgba(180,230,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R + 9, b.spin, b.spin + 4); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(b.x, GY + 4, BALL_R * (0.6 + 0.4 * (b.y / GY)), 5, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.spin);
  ctx.fillStyle = b.fire > 0 ? '#fff3c4' : '#fff'; ctx.beginPath(); ctx.arc(0, 0, BALL_R, 0, 7); ctx.fill();
  ctx.fillStyle = '#1b1b1b';
  function pent(x, y, r) { ctx.beginPath(); for (var i = 0; i < 5; i++) { var a = i / 5 * 6.283 - 1.57; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
  pent(0, 0, 6.5); for (var i = 0; i < 5; i++) { var a = i / 5 * 6.283 - 1.57; pent(Math.cos(a) * 15, Math.sin(a) * 15, 4.5); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, 7); ctx.stroke();
}

/* اللاعب: راس كبيرة + جسم صغير. f = اتجاه الوش، kick = 0..1 */
function drawGuy(ctx, L, o) {
  var x = o.x, y = o.y, f = o.f, s = o.s || 1, hr = o.hr || 35, kick = o.kick || 0, look = o.look || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(f * s, s);
  if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 3, 30, 6, 0, 0, 7); ctx.fill(); }
  if (o.frozen) ctx.globalAlpha = 0.85;
  // الرجلين
  ctx.lineCap = 'round';
  var back = -0.15, front = kick > 0 ? -1.2 * Math.sin(kick * Math.PI) : 0.12;
  function leg(a, col) { ctx.save(); ctx.translate(0, -30); ctx.rotate(-a); ctx.fillStyle = L.skin; ctx.fillRect(-5, 0, 10, 20); ctx.fillStyle = L.shorts; ctx.fillRect(-7, -4, 14, 10); ctx.fillStyle = L.boots; rr(ctx, -6, 18, 22, 11, 5); ctx.fill(); ctx.restore(); }
  leg(back); leg(front);
  // الجسم
  ctx.fillStyle = L.shirt; rr(ctx, -20, -78, 40, 52, 12); ctx.fill();
  ctx.fillStyle = L.trim; ctx.fillRect(-20, -54, 40, 6);
  ctx.fillStyle = L.shorts; rr(ctx, -19, -32, 38, 12, 4); ctx.fill();
  // الدراع
  ctx.strokeStyle = L.shirt; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(4, -70); ctx.lineTo(kick ? -14 : 12, -50); ctx.stroke();
  ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(kick ? -15 : 13, -47, 5.5, 0, 7); ctx.fill();
  // الراس
  var hy = -78 - hr * 0.8;
  drawHead(ctx, L, 0, hy, hr, o);
  ctx.restore();
}
function drawHead(ctx, L, x, y, r, o) {
  o = o || {};
  var hc = L.hc, H = L.hair;
  if (H === 'long') { ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y + r * 0.15, r * 0.95, r * 1.05, 0, 0, 7); ctx.fill(); }
  if (H === 'afro') { ctx.fillStyle = hc; ctx.beginPath(); ctx.arc(x - r * 0.08, y - r * 0.18, r * 1.32, 0, 7); ctx.fill(); }
  // الوش
  ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.beginPath(); ctx.arc(x - r * 0.25, y + r * 0.1, r * 0.86, 1.2, 3.6); ctx.fill();
  // الودن
  ctx.fillStyle = L.skin; ctx.beginPath(); ctx.ellipse(x - r * 0.62, y + r * 0.08, r * 0.17, r * 0.24, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(x - r * 0.62, y + r * 0.08, r * 0.08, r * 0.13, 0, 0, 7); ctx.fill();
  // الشعر
  ctx.fillStyle = hc;
  if (H === 'short' || H === 'long' || H === 'curly') { ctx.beginPath(); ctx.arc(x, y - r * 0.05, r * 1.02, Math.PI * 1.02, Math.PI * 2.05); ctx.quadraticCurveTo(x + r * 0.6, y - r * 0.55, x - r * 0.1, y - r * 0.5); ctx.quadraticCurveTo(x - r * 0.6, y - r * 0.35, x - r * 0.98, y + r * 0.1); ctx.fill(); }
  if (H === 'curly') { for (var c = 0; c < 9; c++) { var a = Math.PI * (1.0 + c / 8); ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.9, y - r * 0.05 + Math.sin(a) * r * 0.9, r * 0.24, 0, 7); ctx.fill(); } }
  if (H === 'buzz') { ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.arc(x, y, r * 1.0, Math.PI * 1.08, Math.PI * 1.98); ctx.lineTo(x + r * 0.5, y - r * 0.62); ctx.quadraticCurveTo(x - r * 0.3, y - r * 0.7, x - r * 0.95, y - r * 0.05); ctx.fill(); ctx.globalAlpha = 1; }
  if (H === 'spiky') { ctx.beginPath(); ctx.moveTo(x - r * 0.98, y + r * 0.05); for (var sp = 0; sp <= 12; sp++) { var a2 = Math.PI * (1.04 + sp / 12 * 0.94), rr2 = sp % 2 ? r * 0.98 : r * 1.22; ctx.lineTo(x + Math.cos(a2) * rr2, y - r * 0.02 + Math.sin(a2) * rr2); } ctx.quadraticCurveTo(x + r * 0.3, y - r * 0.5, x - r * 0.2, y - r * 0.45); ctx.quadraticCurveTo(x - r * 0.7, y - r * 0.3, x - r * 0.98, y + r * 0.05); ctx.closePath(); ctx.fill(); }
  if (H === 'mohawk') { ctx.beginPath(); ctx.moveTo(x - r * 0.55, y - r * 0.72); ctx.quadraticCurveTo(x - r * 0.1, y - r * 1.75, x + r * 0.62, y - r * 0.7); ctx.quadraticCurveTo(x, y - r * 0.95, x - r * 0.55, y - r * 0.72); ctx.fill(); }
  if (H === 'afro') { ctx.beginPath(); ctx.arc(x - r * 0.08, y - r * 0.42, r * 1.0, Math.PI * 0.95, Math.PI * 2.08); ctx.fill(); }
  if (L.band) { ctx.strokeStyle = L.band; ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.arc(x, y + r * 0.05, r * 0.98, Math.PI * 1.12, Math.PI * 1.9); ctx.stroke(); }
  // الدقن
  if (L.beard) {
    ctx.fillStyle = L.beard === 1 ? 'rgba(40,25,15,.35)' : hc;
    ctx.beginPath();
    if (L.beard === 3) { ctx.ellipse(x + r * 0.42, y + r * 0.72, r * 0.2, r * 0.18, 0, 0, 7); }
    else { ctx.moveTo(x - r * 0.45, y + r * 0.25); ctx.quadraticCurveTo(x - r * 0.1, y + r * 1.08, x + r * 0.7, y + r * 0.55); ctx.lineTo(x + r * 0.78, y + r * 0.25); ctx.quadraticCurveTo(x + r * 0.2, y + r * 0.62, x - r * 0.45, y + r * 0.25); }
    ctx.fill();
  }
  // العين والحاجب
  var ex = x + r * 0.42, ey = y - r * 0.08, angry = o.kick > 0 || o.angry;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, ey, r * 0.22, r * (o.frozen ? 0.1 : 0.25), 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a1010'; ctx.beginPath(); ctx.arc(ex + r * 0.08 + (o.look || 0) * r * 0.05, ey + r * 0.03, r * 0.11, 0, 7); ctx.fill();
  ctx.strokeStyle = L.beard === 2 || L.hair === 'bald' ? '#2a1a12' : hc; ctx.lineWidth = r * 0.1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ex - r * 0.2, ey - r * (angry ? 0.36 : 0.42)); ctx.lineTo(ex + r * 0.24, ey - r * (angry ? 0.24 : 0.4)); ctx.stroke();
  // البوق والمناخير
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = r * 0.07; ctx.beginPath(); ctx.arc(x + r * 0.78, y + r * 0.12, r * 0.12, -1.2, 1.3); ctx.stroke();
  ctx.strokeStyle = '#5a2a20'; ctx.lineWidth = r * 0.08; ctx.beginPath();
  if (o.happy) { ctx.fillStyle = '#5a2a20'; ctx.arc(x + r * 0.5, y + r * 0.44, r * 0.2, 0, Math.PI); ctx.fill(); }
  else { ctx.moveTo(x + r * 0.32, y + r * 0.48); ctx.quadraticCurveTo(x + r * 0.5, y + r * (angry ? 0.42 : 0.56), x + r * 0.68, y + r * 0.46); ctx.stroke(); }
  if (o.frozen) { ctx.fillStyle = 'rgba(150,220,255,.45)'; ctx.beginPath(); ctx.arc(x, y, r * 1.08, 0, 7); ctx.fill(); }
}
/** صورة اللاعب للكروت (راس وكتاف) */
function portrait(canvas, ch, opt) {
  opt = opt || {}; var dpr = Math.min(2, root.devicePixelRatio || 1), w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
  canvas.width = w * dpr; canvas.height = h * dpr; var ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  var L = ch.look, r = Math.min(w, h) * 0.3;
  ctx.save(); ctx.translate(w / 2, h * 0.5);
  ctx.fillStyle = L.shirt; rr(ctx, -r * 0.95, r * 0.55, r * 1.9, r * 1.4, r * 0.45); ctx.fill();
  ctx.fillStyle = L.trim; ctx.fillRect(-r * 0.95, r * 0.95, r * 1.9, r * 0.16);
  ctx.restore();
  drawHead(ctx, L, w / 2, h * 0.38, r, { happy: opt.happy });
}

/* ======================= الماتش على الشاشة ======================= */
function Match(o) {
  var self = this; this.o = o; this.alive = true;
  this.world = new World({ c1: o.c1, c2: o.c2, u1: o.u1, u2: o.u2, time: o.time || MATCH_T });
  this.ai = o.mode === 'local' ? null : new AI(o.ai == null ? 1 : o.ai);
  this.inp = [{}, {}]; this.arena = ARENAS[clamp(o.arena | 0, 0, ARENAS.length - 1)];
  this.bg = mkCanvas(FW, FH); drawArena(this.bg.getContext('2d'), this.arena, clamp(o.arena | 0, 0, 4));
  this.fx = []; this.banner = null; this.t0 = 0; this.acc = 0;
  this.build();
  this.loop = function (ts) { if (!self.alive) return; self.frame(ts); self.raf = root.requestAnimationFrame(self.loop); };
  this.raf = root.requestAnimationFrame(this.loop);
  api.active = this;
}
Match.prototype.build = function () {
  var o = this.o, self = this, el = document.createElement('div');
  el.className = 'kora-stage'; el.setAttribute('dir', 'ltr');
  var L = o.lang === 'en';
  var pad = function (pi, side) {
    return '<div class="kp kp' + side + '" data-p="' + pi + '">' +
      '<div class="kp-move"><button class="kb" data-k="l" aria-label="left">◀</button><button class="kb" data-k="r" aria-label="right">▶</button></div>' +
      '<div class="kp-act"><button class="kb kb-sup" data-k="sup" aria-label="super"><i></i><span>' + SUPERS[pi ? o.c2.sup : o.c1.sup].ic + '</span></button>' +
      '<button class="kb kb-j" data-k="jump" aria-label="jump">⤒</button><button class="kb kb-k" data-k="kick" aria-label="kick">👟</button></div></div>';
  };
  el.innerHTML = '<div class="kora-land"><canvas class="kora-cv"></canvas>' +
    '<button class="kx" data-exit aria-label="exit">✕</button>' +
    pad(0, o.mode === 'local' ? 'l' : 'solo') + (o.mode === 'local' ? pad(1, 'r') : '') + '</div>';
  (o.mount || document.body).appendChild(el);
  this.el = el; this.land = el.firstChild; this.cv = el.querySelector('canvas'); this.ctx = this.cv.getContext('2d');
  // أزرار باللمس (أكتر من صباع في نفس الوقت)
  var set = function (b, v) { var p = +b.closest('.kp').getAttribute('data-p'), k = b.getAttribute('data-k'); self.inp[p][k] = v; b.classList.toggle('on', v); if (v && k !== 'l' && k !== 'r' && navigator.vibrate) try { navigator.vibrate(8); } catch (e) {} };
  Array.prototype.forEach.call(el.querySelectorAll('.kb'), function (b) {
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} set(b, true); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { b.addEventListener(t, function () { set(b, false); }); });
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  });
  el.querySelector('[data-exit]').addEventListener('click', function () { if (o.onExit) o.onExit(); });
  // كيبورد (للكمبيوتر): A D W S + E — وللاعب التاني الأسهم
  this.keys = function (e) {
    var down = e.type === 'keydown', k = e.key.toLowerCase(), m = { a: [0, 'l'], d: [0, 'r'], w: [0, 'jump'], s: [0, 'kick'], e: [0, 'sup'], ' ': [0, 'jump'],
      arrowleft: [o.mode === 'local' ? 1 : 0, 'l'], arrowright: [o.mode === 'local' ? 1 : 0, 'r'], arrowup: [o.mode === 'local' ? 1 : 0, 'jump'], arrowdown: [o.mode === 'local' ? 1 : 0, 'kick'], enter: [o.mode === 'local' ? 1 : 0, 'sup'] }[k];
    if (m) { self.inp[m[0]][m[1]] = down; e.preventDefault(); }
  };
  root.addEventListener('keydown', this.keys); root.addEventListener('keyup', this.keys);
  this.resize = function () { self.layout(); }; root.addEventListener('resize', this.resize);
  this.layout();
};
Match.prototype.layout = function () {
  var W = root.innerWidth, H = root.innerHeight, port = H > W, lw = port ? H : W, lh = port ? W : H;
  this.land.style.width = lw + 'px'; this.land.style.height = lh + 'px';
  this.land.style.transform = port ? 'translate(' + W + 'px,0) rotate(90deg)' : 'none';
  var sc = Math.min(lw / FW, lh / FH), cw = FW * sc, chh = FH * sc, dpr = Math.min(2, root.devicePixelRatio || 1);
  this.cv.style.width = cw + 'px'; this.cv.style.height = chh + 'px';
  this.cv.style.left = (lw - cw) / 2 + 'px'; this.cv.style.top = (lh - chh) / 2 + 'px';
  this.cv.width = Math.round(cw * dpr); this.cv.height = Math.round(chh * dpr); this.sc = sc * dpr;
};
Match.prototype.frame = function (ts) {
  var dt = this.t0 ? Math.min(0.05, (ts - this.t0) / 1000) : 1 / 60; this.t0 = ts;
  var w = this.world, step = 1 / 120;
  this.acc += dt;
  while (this.acc >= step) {
    var in2 = this.ai ? this.ai.think(w, 1, step) : this.inp[1];
    w.step(step, [this.inp[0], in2]);
    this.inp[0].sup = false; if (!this.ai) this.inp[1].sup = false;
    this.acc -= step;
    this.handle(w.events); w.events.length = 0;
    if (!this.alive) return;
  }
  this.draw(dt);
};
Match.prototype.handle = function (evs) {
  var o = this.o, w = this.world, self = this;
  evs.forEach(function (e) {
    var sfx = o.sfx || function () {};
    if (e.n === 'kick' || e.n === 'fireshot') sfx('kick');
    else if (e.n === 'head') sfx('head');
    else if (e.n === 'post') sfx('post');
    else if (e.n === 'whistle') sfx('whistle');
    else if (e.n === 'tackle') sfx('tackle');
    else if (e.n === 'super') { sfx('super'); self.flash(SUPERS[w.p[e.a.i].ch.sup].ic + ' ' + (o.lang === 'en' ? SUPERS[e.a.s].en : SUPERS[e.a.s].ar), e.a.i); }
    else if (e.n === 'goal') { sfx('goal'); self.goalFx(e.a); }
    else if (e.n === 'end') {
      sfx('whistle');
      setTimeout(function () { if (self.alive && o.onEnd) o.onEnd({ score: w.score.slice(), win: w.score[0] > w.score[1] ? 0 : w.score[1] > w.score[0] ? 1 : -1, goals: [w.p[0].goals, w.p[1].goals] }); }, 900);
    }
  });
};
Match.prototype.flash = function (txt, side) { this.banner = { t: 1.4, txt: txt, side: side }; };
Match.prototype.goalFx = function (who) {
  this.banner = { t: 1.6, txt: this.o.lang === 'en' ? 'GOOOAL!' : 'جوووول!', big: 1, side: who };
  for (var i = 0; i < 70; i++) this.fx.push({ x: who === 0 ? FW - 60 : 60, y: GY - 120, vx: (Math.random() - 0.5) * 700, vy: -300 - Math.random() * 600, t: 1.6, c: ['#f2c94c', '#e23b3b', '#fff', '#2d7dd2', '#14967f'][i % 5] });
  if (navigator.vibrate) try { navigator.vibrate([30, 40, 60]); } catch (e) {}
};
Match.prototype.draw = function (dt) {
  var c = this.ctx, w = this.world, b = w.ball, o = this.o;
  c.setTransform(this.sc, 0, 0, this.sc, 0, 0);
  if (w.shake > 0) c.translate((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10);
  c.drawImage(this.bg, 0, 0);
  // الحيطة
  w.p.forEach(function (p, i) { if (p.fx.wall > 0) { var wx = i === 0 ? GOAL_W + 8 : FW - GOAL_W - 26; c.fillStyle = '#b5532c'; c.fillRect(wx, GY - 225, 18, 225); c.fillStyle = 'rgba(0,0,0,.25)'; for (var y = GY - 225; y < GY; y += 20) c.fillRect(wx, y, 18, 2); } });
  // اللعيبة
  w.p.forEach(function (p, i) {
    var L = (i ? o.c2 : o.c1).look, kick = p.kickT > 0 ? (0.3 - p.kickT) / 0.3 : 0;
    if (p.fx.bolt > 0) { c.globalAlpha = 0.25; drawGuy(c, L, { x: p.x - p.vx * 0.05, y: p.y, f: p.f, s: p.scale(), hr: p.headR(), shadow: false }); c.globalAlpha = 1; }
    if (p.fx.fire > 0) { c.fillStyle = 'rgba(255,120,0,.35)'; c.beginPath(); c.arc(p.x + p.f * 30, p.y - 16, 18 + Math.random() * 6, 0, 7); c.fill(); }
    drawGuy(c, L, { x: p.x, y: p.y, f: p.f, s: p.scale(), hr: p.headR(), kick: kick, frozen: p.fx.freeze > 0, happy: p.mood > 0 && w.lastGoal === i, angry: p.stun > 0, look: (b.y - p.headY()) / 200 });
    if (p.stun > 0 && !(p.fx.freeze > 0)) { c.font = '22px system-ui'; c.textAlign = 'center'; c.fillText('💫', p.x, p.headY() - p.headR() - 6); }
    if (p.fx.magnet > 0) { c.strokeStyle = 'rgba(120,200,255,.6)'; c.lineWidth = 2; c.beginPath(); c.arc(p.x + p.f * 34, p.y - 20, 30 + Math.random() * 6, 0, 7); c.stroke(); }
  });
  drawBall(c, b);
  drawGoalFront(c);
  // مؤثرات
  var self = this;
  this.fx = this.fx.filter(function (q) { q.t -= dt; q.vy += 900 * dt; q.x += q.vx * dt; q.y += q.vy * dt; c.globalAlpha = Math.max(0, Math.min(1, q.t)); c.fillStyle = q.c; c.fillRect(q.x, q.y, 7, 11); return q.t > 0; });
  c.globalAlpha = 1;
  this.hud(c);
};
Match.prototype.hud = function (c) {
  var w = this.world, o = this.o, en = o.lang === 'en';
  // لوحة النتيجة
  c.fillStyle = 'rgba(10,14,40,.88)'; rr(c, FW / 2 - 150, 12, 300, 62, 16); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2; c.stroke();
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = '#f2e14b'; c.font = '900 40px system-ui, sans-serif'; c.fillText(w.score[0], FW / 2 - 95, 45); c.fillText(w.score[1], FW / 2 + 95, 45);
  var tl = Math.ceil(Math.max(0, w.time)); c.fillStyle = tl <= 10 && w.state === 'play' ? '#ff6b6b' : '#fff'; c.font = '800 30px system-ui, sans-serif'; c.fillText(tl, FW / 2, 45);
  c.font = '700 15px system-ui, sans-serif'; c.fillStyle = 'rgba(255,255,255,.85)';
  c.fillText(en ? o.c1.en : o.c1.ar, FW / 2 - 230, 32); c.fillText(en ? o.c2.en : o.c2.ar, FW / 2 + 230, 32);
  // عدّاد القوة
  [0, 1].forEach(function (i) {
    var p = w.p[i], x = i === 0 ? FW / 2 - 290 : FW / 2 + 170;
    c.fillStyle = 'rgba(0,0,0,.45)'; rr(c, x, 48, 120, 12, 6); c.fill();
    c.fillStyle = p.sup >= 100 ? '#ffd23f' : '#4fc3f7'; rr(c, x, 48, 120 * p.sup / 100, 12, 6); c.fill();
  });
  if (w.state === 'count') { c.fillStyle = 'rgba(255,255,255,.95)'; c.font = '900 120px system-ui, sans-serif'; c.fillText(Math.ceil(w.stT), FW / 2, FH / 2 - 40); }
  if (this.banner) {
    var B = this.banner; B.t -= 1 / 60;
    c.save(); c.translate(FW / 2, FH / 2 - 60); var k = Math.min(1, (1.6 - B.t) * 4); c.scale(k, k);
    c.font = (B.big ? '900 92px ' : '900 46px ') + 'system-ui, sans-serif'; c.lineWidth = 10; c.strokeStyle = 'rgba(0,0,0,.6)';
    c.strokeText(B.txt, 0, 0); c.fillStyle = B.big ? '#ffd23f' : '#fff'; c.fillText(B.txt, 0, 0); c.restore();
    if (B.t <= 0) this.banner = null;
  }
  // زرار القوة بيلمع لما يتملي
  var sb = this.el.querySelectorAll('.kb-sup');
  for (var i = 0; i < sb.length; i++) { var pi = +sb[i].closest('.kp').getAttribute('data-p'), v = w.p[pi].sup; sb[i].classList.toggle('ready', v >= 100); sb[i].firstChild.style.height = v + '%'; }
};
Match.prototype.destroy = function () {
  this.alive = false; root.cancelAnimationFrame(this.raf); if (api.active === this) api.active = null;
  root.removeEventListener('keydown', this.keys); root.removeEventListener('keyup', this.keys); root.removeEventListener('resize', this.resize);
  if (this.el) this.el.remove();
};

var api = { FW: FW, FH: FH, CHARS: CHARS, CHAR: CHAR, SUPERS: SUPERS, ARENAS: ARENAS, params: params, rating: rating,
  World: World, AI: AI, simulate: simulate, seeded: seeded, portrait: portrait,
  start: function (o) { return new Match(o); } };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
root.Kora = api;
})(typeof window !== 'undefined' ? window : globalThis);
