let audioRef: HTMLAudioElement | null = null;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function sendNotification(title: string, body: string): void {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      requireInteraction: true,
    });
  }
  playAlarmSound();
}

export function playAlarmSound(): void {
  try {
    if (!audioRef) {
      audioRef = new Audio("/alarm.wav");
      audioRef.loop = true;
    }
    audioRef.currentTime = 0;
    audioRef.play().catch(() => {});
  } catch {
    // Audio not available
  }
}

export function stopAlarmSound(): void {
  if (audioRef) {
    audioRef.pause();
    audioRef.currentTime = 0;
  }
}
