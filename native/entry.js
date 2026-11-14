// جسر الأبلكيشن: دخول جوجل من الموبايل نفسه + الإشعارات + زرار الرجوع
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { PushNotifications } from '@capacitor/push-notifications';

let pushToken = null;
const waiters = [];

// قناة الإشعارات لازم تتعمل مع فتح الأبلكيشن، مش وقت التفعيل بس.
// لو السيرفر بعت على قناة مش موجودة، أندرويد بيرمي الإشعار من غير ما يبان.
const channelReady = (async () => {
  if (!Capacitor.isNativePlatform()) return;
  for (const id of ['lamma', 'default']) {
    try {
      await PushNotifications.createChannel({
        id, name: 'لمّة', description: 'دعوات اللعب والرسايل وطلبات الصداقة',
        importance: 5, visibility: 1, sound: 'default', vibration: true, lights: true,
      });
    } catch (e) { /* أندرويد قديم */ }
  }
})();

// المستمعين بيتسجّلوا مرة واحدة مع فتح الأبلكيشن، فالعنوان بيتمسك حتى لو وصل بدري
PushNotifications.addListener('registration', (t) => {
  pushToken = t && t.value;
  if (window.LammaSaveToken && pushToken) window.LammaSaveToken(pushToken);
  while (waiters.length) waiters.shift()(pushToken);
});
PushNotifications.addListener('registrationError', () => { while (waiters.length) waiters.shift()(null); });
channelReady.then(() =>
  PushNotifications.checkPermissions()
    .then((p) => { if (p.receive === 'granted') PushNotifications.register(); })
    .catch(() => {}));

// الإشعار اللي بيوصل والأبلكيشن مفتوح: أندرويد مش بيحطه في الشريط، فبنوريه جوه اللعبة
PushNotifications.addListener('pushNotificationReceived', (n) => {
  const d = (n && n.data) || {};
  const title = (n && n.title) || d.title || 'لمّة';
  const body = (n && n.body) || d.body || '';
  if (window.LammaPushShow) window.LammaPushShow(title, body, d);
});

window.LammaNative = {
  isNative: () => Capacitor.isNativePlatform(),
  googleIdToken: async () => {
    const r = await FirebaseAuthentication.signInWithGoogle();
    return r && r.credential ? r.credential.idToken : null;
  },
  // يطلب إذن الإشعارات ويرجّع عنوان الموبايل (FCM token)
  pushRegister: async () => {
    let p = await PushNotifications.checkPermissions();
    if (p.receive === 'prompt' || p.receive === 'prompt-with-rationale') p = await PushNotifications.requestPermissions();
    if (p.receive !== 'granted') return null;
    await channelReady;
    if (pushToken) return pushToken;
    await PushNotifications.register();
    // لو الحدث فات، بنستنى اللي اتسجّل عند فتح الأبلكيشن
    return new Promise((resolve) => {
      if (pushToken) return resolve(pushToken);
      waiters.push(resolve);
      setTimeout(() => resolve(pushToken), 20000);
    });
  },
  lastToken: () => pushToken,
  signOut: () => FirebaseAuthentication.signOut(),
  exitApp: () => App.exitApp(),
};

// لما تدوس على إشعار: افتح الشات أو الطلبات
PushNotifications.addListener('pushNotificationActionPerformed', (a) => {
  const data = (a && a.notification && a.notification.data) || {};
  if (window.LammaPushOpen) window.LammaPushOpen(data);
});

// العنوان ممكن يتغيّر، فبنتأكد منه كل ما الأبلكيشن يرجع يشتغل
App.addListener('appStateChange', (s) => {
  if (!s || !s.isActive) return;
  PushNotifications.checkPermissions()
    .then((p) => { if (p.receive === 'granted') PushNotifications.register(); })
    .catch(() => {});
});

App.addListener('backButton', () => {
  if (window.LammaBack) window.LammaBack();
  else App.exitApp();
});
