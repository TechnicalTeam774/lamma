// جسر الأبلكيشن: دخول جوجل من الموبايل نفسه + الإشعارات + زرار الرجوع
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { PushNotifications } from '@capacitor/push-notifications';

let pushToken = null;
const waiters = [];
// المستمعين بيتسجّلوا مرة واحدة مع فتح الأبلكيشن، فالعنوان بيتمسك حتى لو وصل بدري
PushNotifications.addListener('registration', (t) => {
  pushToken = t && t.value;
  if (window.LammaSaveToken && pushToken) window.LammaSaveToken(pushToken);
  while (waiters.length) waiters.shift()(pushToken);
});
PushNotifications.addListener('registrationError', () => { while (waiters.length) waiters.shift()(null); });
PushNotifications.checkPermissions().then((p) => { if (p.receive === 'granted') PushNotifications.register(); }).catch(() => {});
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
    try { await PushNotifications.createChannel({ id: 'lamma', name: 'لمّة', importance: 4, sound: 'default', vibration: true }); } catch (e) { /* أندرويد قديم */ }
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
App.addListener('backButton', () => {
  if (window.LammaBack) window.LammaBack();
  else App.exitApp();
});
