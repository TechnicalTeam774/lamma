/**
 * لمّة — سيرفر الإشعارات (Google Apps Script)
 * ------------------------------------------------------------------
 * فيه حاجتين:
 *   1) افتح رابط الـ Web App في المتصفح  →  صفحة فحص بتقولك العطل فين بالظبط.
 *   2) الأبلكيشن بيبعتله POST  →  بيبعت الإشعار.
 *
 * إعداد لمرة واحدة:
 *   Project Settings > Script properties > أضف خاصية اسمها  SA_JSON
 *   وحطّ فيها محتوى ملف مفتاح حساب الخدمة (Service account JSON) كله.
 *   الملف ده سري جدًا — متبعتهوش لحد ومتصوّرهوش.
 */

var PROJECT_ID = 'lamma-game-5e684';
var WEB_API_KEY = 'AIzaSyAvNndToSDPfGr7cGkD8zMZGWEm103k8JE'; // مفتاح الويب العام، مش سري
var CHANNEL = 'lamma';
var SERVER_VER = 3; // 3: اسم حقل المرسل بقى sender بدل from (جوجل بترفض from)
var SCOPES = 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore';

/* ============================ أدوات ============================ */

function sa_() {
  var raw = PropertiesService.getScriptProperties().getProperty('SA_JSON');
  if (!raw) throw new Error('SA_JSON مش موجودة في Script properties');
  var j;
  try { j = JSON.parse(raw); } catch (e) { throw new Error('SA_JSON مش JSON صحيح — غالبًا اتنسخت ناقصة'); }
  if (!j.client_email || !j.private_key) throw new Error('SA_JSON ناقصة client_email أو private_key');
  return j;
}

/** توكن دخول من حساب الخدمة (بيتخزّن مؤقتًا 50 دقيقة) */
function accessToken_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('at');
  if (hit) return hit;

  var j = sa_(), now = Math.floor(Date.now() / 1000);
  var head = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  var body = Utilities.base64EncodeWebSafe(JSON.stringify({
    iss: j.client_email, scope: SCOPES,
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600
  }));
  var unsigned = head.replace(/=+$/, '') + '.' + body.replace(/=+$/, '');
  var sig = Utilities.base64EncodeWebSafe(
    Utilities.computeRsaSha256Signature(unsigned, j.private_key)).replace(/=+$/, '');

  var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post', muteHttpExceptions: true,
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + sig }
  });
  var out = JSON.parse(res.getContentText() || '{}');
  if (!out.access_token) {
    throw new Error('token: ' + (out.error_description || out.error || res.getContentText()).toString().slice(0, 160));
  }
  cache.put('at', out.access_token, 3000);
  return out.access_token;
}

function fsUrl_(path) {
  return 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents/' + path;
}

function fsFetch_(url, opts) {
  opts = opts || {};
  opts.muteHttpExceptions = true;
  opts.headers = { Authorization: 'Bearer ' + accessToken_() };
  if (opts.payload && typeof opts.payload !== 'string') {
    opts.payload = JSON.stringify(opts.payload);
    opts.contentType = 'application/json';
  }
  var r = UrlFetchApp.fetch(url, opts);
  var txt = r.getContentText();
  var j = {};
  try { j = JSON.parse(txt || '{}'); } catch (e) { j = { raw: txt }; }
  j.__code = r.getResponseCode();
  return j;
}

/** بيحوّل حقول Firestore لشكل عادي */
function plain_(fields) {
  var o = {};
  Object.keys(fields || {}).forEach(function (k) {
    var v = fields[k];
    o[k] = v.stringValue !== undefined ? v.stringValue
      : v.integerValue !== undefined ? Number(v.integerValue)
        : v.booleanValue !== undefined ? v.booleanValue
          : v.timestampValue !== undefined ? v.timestampValue : null;
  });
  return o;
}

/** بيتأكد إن اللي بعت هو فعلًا صاحب الحساب، وبيرجّع الـ uid */
function uidFromIdToken_(idToken) {
  if (!idToken) return null;
  var r = UrlFetchApp.fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + WEB_API_KEY, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ idToken: idToken })
    });
  var j = {};
  try { j = JSON.parse(r.getContentText() || '{}'); } catch (e) { return null; }
  if (j.users && j.users.length) return j.users[0].localId;
  return null;
}

function tokensOf_(uid) {
  var j = fsFetch_(fsUrl_('users/' + uid + '/tokens') + '?pageSize=50');
  var out = [];
  (j.documents || []).forEach(function (d) {
    var p = plain_(d.fields);
    if (p.token) out.push({ name: d.name, token: p.token, platform: p.platform || '' });
  });
  return out;
}

/** بيبعت لجهاز واحد. بيرجّع 'ok' أو سبب الفشل */
function sendOne_(tok, title, body, data) {
  var msg = {
    message: {
      token: tok,
      notification: { title: title, body: body },
      data: data || {},
      android: {
        priority: 'HIGH',
        notification: {
          channel_id: CHANNEL,
          sound: 'default',
          default_vibrate_timings: true,
          notification_priority: 'PRIORITY_MAX'
        }
      },
      webpush: { headers: { Urgency: 'high' } }
    }
  };
  var r = UrlFetchApp.fetch(
    'https://fcm.googleapis.com/v1/projects/' + PROJECT_ID + '/messages:send', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + accessToken_() },
      payload: JSON.stringify(msg)
    });
  var code = r.getResponseCode(), txt = r.getContentText();
  if (code === 200) return 'ok';
  return 'http ' + code + ': ' + txt.slice(0, 200);
}

function sendToUid_(uid, title, body, data) {
  var toks = tokensOf_(uid), sent = 0, last = '';
  toks.forEach(function (x) {
    var r = sendOne_(x.token, title, body, data);
    if (r === 'ok') sent++;
    else {
      last = r;
      // امسح الجهاز بس لو جوجل قالت صراحة إن عنوانه مات.
      // (زمان كنا بنمسح مع أي INVALID_ARGUMENT، فغلطة في الرسالة نفسها كانت بتمسح كل الأجهزة)
      if (/UNREGISTERED|http 404|registration token is not a valid/i.test(r)) {
        fsFetch_('https://firestore.googleapis.com/v1/' + x.name, { method: 'delete' });
      }
    }
  });
  var res = { devices: toks.length, sent: sent, last: last };
  saveLast_(data && data.type, res);
  return res;
}

/** آخر محاولة إرسال — بتظهر في صفحة الفحص. من غير توكنات ولا أرقام حسابات */
function saveLast_(type, r) {
  try {
    PropertiesService.getScriptProperties().setProperty('LAST', JSON.stringify({
      t: new Date().toISOString(), type: String(type || ''), devices: r.devices, sent: r.sent,
      last: String(r.last || '').replace(/[A-Za-z0-9_:\-]{60,}/g, '…').slice(0, 220)
    }));
  } catch (e) { /* مش مهم */ }
}

/* ============================ الإرسال ============================ */

function doPost(e) {
  var out = function (o) {
    return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  };
  try {
    var b = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var from = uidFromIdToken_(b.idToken);
    if (!from) return out({ err: 'auth', v: SERVER_VER });
    if (!b.to) return out({ err: 'no-to' });

    var who = b.name || 'صاحبك', title, body;
    if (b.type === 'test') { title = 'لمّة'; body = 'الإشعارات شغالة ✓'; }
    else if (b.type === 'chat') { title = who; body = b.text || 'بعتلك رسالة'; }
    else if (b.type === 'invite') { title = 'دعوة لعب'; body = who + ' عايز يلعب معاك' + (b.game ? ' ' + b.game : ''); }
    else if (b.type === 'friend') { title = 'طلب صداقة'; body = who + ' عايز يضيفك'; }
    else { title = 'لمّة'; body = who; }

    // متستخدمش from هنا: جوجل حاجزاه وبترفض الرسالة كلها (INVALID_ARGUMENT)
    var r = sendToUid_(b.to, title, body, {
      type: String(b.type || ''), sender: String(from), name: String(who)
    });
    return out({ ok: true, v: SERVER_VER, sent: r.sent, devices: r.devices, last: r.last });
  } catch (err) {
    return out({ err: String((err && err.message) || err).slice(0, 200) });
  }
}

/* ======================== صفحة الفحص ======================== */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var L = [], okAll = true;
  var line = function (good, label, detail) {
    if (!good) okAll = false;
    L.push('<div class="r ' + (good ? 'y' : 'n') + '"><b>' + (good ? '✓' : '✗') + '</b><div><div class="t">'
      + label + '</div>' + (detail ? '<div class="d">' + detail + '</div>' : '') + '</div></div>');
  };
  var esc = function (s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };

  line(true, 'نسخة السيرفر ' + SERVER_VER, 'لو مكتوب هنا رقم أقل من 3، يبقى لسه منشرتش النسخة الجديدة');

  // 1) المفتاح
  var saOk = false, j = null;
  try { j = sa_(); saOk = true; line(true, 'مفتاح حساب الخدمة موجود', esc(j.client_email)); }
  catch (err) { line(false, 'مفتاح حساب الخدمة', esc(err.message)); }

  if (saOk && j.project_id !== PROJECT_ID) {
    line(false, 'المفتاح بتاع مشروع تاني', 'المفتاح: ' + esc(j.project_id) + ' — المطلوب: ' + PROJECT_ID);
  } else if (saOk) {
    line(true, 'المفتاح بتاع المشروع الصح', PROJECT_ID);
  }

  // 2) توكن الدخول
  var atOk = false;
  if (saOk) {
    try { accessToken_(); atOk = true; line(true, 'جوجل قبلت المفتاح', 'توكن الدخول اتجاب تمام'); }
    catch (err) { line(false, 'جوجل رفضت المفتاح', esc(err.message)); }
  }

  // 3) فايرستور
  var cfg = null;
  if (atOk) {
    var c = fsFetch_(fsUrl_('config/push'));
    if (c.__code === 200) {
      cfg = plain_(c.fields);
      line(true, 'بنقرا من فايرستور', 'config/push اتقرا تمام');
    } else if (c.__code === 404) {
      line(false, 'مفيش مستند config/push في فايرستور', 'اعمله وحطّ فيه حقل notifyUrl');
    } else {
      line(false, 'مش قادرين نقرا فايرستور', 'كود ' + c.__code + ' — ' + esc(JSON.stringify(c).slice(0, 160)));
    }
  }

  // 4) الرابط المسجّل = الرابط ده؟
  var mine = '';
  try { mine = ScriptApp.getService().getUrl(); } catch (err) { mine = ''; }
  if (cfg) {
    var saved = cfg.notifyUrl || '';
    if (!saved) line(false, 'الأبلكيشن مش عارف السيرفر', 'حقل notifyUrl فاضي في config/push');
    else if (mine && saved.replace(/\/+$/, '') !== mine.replace(/\/+$/, '')) {
      line(false, 'الأبلكيشن بيكلّم رابط تاني', 'المسجّل: ' + esc(saved) + '<br>الرابط ده: ' + esc(mine)
        + '<br><a class="btn" href="?fixurl=1">اضغط هنا عشان نصلّحه</a>');
    } else line(true, 'الرابط المسجّل هو الرابط ده', esc(saved));
  }

  // تصليح الرابط لو طلبه
  if (p.fixurl && atOk && mine) {
    var up = fsFetch_(fsUrl_('config/push') + '?updateMask.fieldPaths=notifyUrl',
      { method: 'patch', payload: { fields: { notifyUrl: { stringValue: mine } } } });
    line(up.__code === 200, 'تصليح الرابط', up.__code === 200 ? 'اتسجّل: ' + esc(mine) : esc(JSON.stringify(up).slice(0, 160)));
  }

  // 5) الأجهزة المسجّلة
  var uid = p.uid || (cfg && cfg.testUid) || '';
  if (atOk && uid) {
    var toks = [];
    try { toks = tokensOf_(uid); } catch (err) { }
    line(toks.length > 0, 'أجهزة مسجّلة للحساب ده', toks.length
      ? toks.map(function (x) { return x.platform + ' · ' + x.token.slice(0, 18) + '…'; }).join('<br>')
      : 'مفيش ولا جهاز — افتح الأبلكيشن وفعّل الإشعارات');
    if (p.send && toks.length) {
      var r = sendToUid_(uid, 'لمّة', 'الإشعارات شغالة ✓', { type: 'test' });
      line(r.sent > 0, 'إرسال إشعار تجريبي', r.sent > 0
        ? ('اتبعت لـ ' + r.sent + ' من ' + r.devices + ' جهاز — بصّ على موبايلك')
        : esc(r.last || 'مفيش رد'));
    } else if (toks.length) {
      L.push('<div class="r y"><b>→</b><div><div class="t"><a class="btn" href="?uid=' + esc(uid)
        + '&send=1">ابعت إشعار تجريبي دلوقتي</a></div></div></div>');
    }
  } else if (atOk) {
    L.push('<div class="r y"><b>?</b><div><div class="t">عايز تختبر الإرسال؟</div>'
      + '<div class="d">حطّ في آخر الرابط <code>?uid=رقم_حسابك</code> — هتلاقيه في إعدادات اللعبة تحت خالص</div></div></div>');
  }

  // آخر إشعار حد بعته من اللعبة
  try {
    var lastRaw = PropertiesService.getScriptProperties().getProperty('LAST');
    if (lastRaw) {
      var lr = JSON.parse(lastRaw);
      var when = Utilities.formatDate(new Date(lr.t), 'Africa/Cairo', 'yyyy-MM-dd HH:mm');
      var okLast = lr.sent > 0;
      L.push('<div class="r ' + (okLast ? 'y' : 'n') + '"><b>' + (okLast ? '✓' : '✗') + '</b><div><div class="t">آخر إشعار اتبعت (' + esc(lr.type || '?') + ') — ' + when + '</div>'
        + '<div class="d">' + (okLast ? ('وصل لـ ' + lr.sent + ' من ' + lr.devices + ' جهاز') : ('أجهزة: ' + lr.devices + ' — ' + esc(lr.last || 'مفيش ولا جهاز مسجّل'))) + '</div></div></div>');
    }
  } catch (err) { }

  var head = okAll ? '<div class="hd y">كل حاجة تمام ✓</div>' : '<div class="hd n">فيه حاجة محتاجة تظبيط</div>';
  var html = '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>فحص إشعارات لمّة</title><style>'
    + 'body{font-family:system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif;background:#16121c;color:#f3eefa;margin:0;padding:18px;line-height:1.6}'
    + '.hd{font-size:1.25rem;font-weight:800;padding:14px 16px;border-radius:14px;margin-bottom:14px}'
    + '.hd.y{background:#17432f;color:#8ef0b9}.hd.n{background:#4a1e1e;color:#ffb4ad}'
    + '.r{display:flex;gap:12px;align-items:flex-start;background:#201a2b;border-radius:14px;padding:12px 14px;margin-bottom:9px}'
    + '.r b{font-size:1.15rem;flex:none;width:20px}.r.y b{color:#5ed99a}.r.n b{color:#ff6b5e}'
    + '.t{font-weight:700}.d{font-size:.9rem;color:#b9aecb;word-break:break-all;margin-top:2px}'
    + 'a.btn{display:inline-block;margin-top:6px;background:#c9a227;color:#1a1230;padding:7px 14px;border-radius:999px;text-decoration:none;font-weight:800}'
    + 'code{background:#2b2338;padding:2px 6px;border-radius:6px}'
    + '</style>' + head + L.join('');
  return HtmlService.createHtmlOutput(html).setTitle('فحص إشعارات لمّة');
}
