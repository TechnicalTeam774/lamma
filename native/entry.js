// جسر الأبلكيشن: دخول جوجل من الموبايل نفسه + الإشعارات + زرار الرجوع
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { PushNotifications } from '@capacitor/push-notifications';

let pushToken = null;
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
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 15000);
      PushNotifications.addListener('registration', (t) => { clearTimeout(timer); pushToken = t.value; resolve(t.value); });
      PushNotifications.addListener('registrationError', () => { clearTimeout(timer); resolve(null); });
      PushNotifications.register();
    });
  },
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
