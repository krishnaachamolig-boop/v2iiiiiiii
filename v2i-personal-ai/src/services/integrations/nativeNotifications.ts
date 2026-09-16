import { Capacitor } from "@capacitor/core";

export interface ScheduleNotificationInput {
  id: string;
  title: string;
  body: string;
  at: Date;
}

/**
 * Schedules a local notification via @capacitor/local-notifications on
 * native Android. On web (browser dev/preview) this is a documented no-op —
 * we do NOT fake success. The UI should reflect that reminders only fire in
 * the background on the installed Android app, not in a browser tab.
 *
 * Android background-delivery caveat: Android's Doze mode and OEM battery
 * optimizers (esp. on Xiaomi/Oppo/Vivo) can delay or kill scheduled
 * notifications unless the user disables battery optimization for the app.
 * We surface this in Settings > Notifications rather than promising
 * unconditional reliability.
 */
export async function scheduleLocalNotification(
  input: ScheduleNotificationInput
): Promise<{ scheduled: boolean; platform: string }> {
  if (!Capacitor.isNativePlatform()) {
    console.info(
      `[Notifications] Web platform detected — "${input.title}" was saved to the database ` +
        `but will NOT fire as a native notification. Install the Android build to get real reminders.`
    );
    return { scheduled: false, platform: "web" };
  }

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== "granted") {
        return { scheduled: false, platform: Capacitor.getPlatform() };
      }
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: hashIdToInt(input.id),
          title: input.title,
          body: input.body,
          schedule: { at: input.at },
        },
      ],
    });
    return { scheduled: true, platform: Capacitor.getPlatform() };
  } catch (err) {
    console.error("[Notifications] Failed to schedule native notification:", err);
    return { scheduled: false, platform: Capacitor.getPlatform() };
  }
}

/** Capacitor local notification ids must be 32-bit ints; UUIDs are not. */
function hashIdToInt(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash * 31 + uuid.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
