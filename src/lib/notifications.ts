let audioCtx: AudioContext | null = null;
let oscillatorNode: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let alarmInterval: ReturnType<typeof setInterval> | null = null;
let swRegistration: ServiceWorkerRegistration | null = null;

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    swRegistration = reg;
    return reg;
  } catch {
    return null;
  }
}

function getSwRegistration(): ServiceWorkerRegistration | null {
  return swRegistration;
}

// Must be called from a user gesture (button click) to unlock audio
export function unlockAudio(): void {
  if (audioCtx) return;
  try {
    audioCtx = new AudioContext();
    // Play a silent sound to unlock
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.01);
  } catch {
    // AudioContext not available
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

// Send alarm notification via service worker (works in background)
export function sendNotification(title: string, body: string, tripId?: string): void {
  const reg = getSwRegistration();
  if (reg?.active) {
    reg.active.postMessage({
      type: "TRIGGER_ALARM_NOTIFICATION",
      data: { body, tripId },
    });
  } else if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      requireInteraction: true,
    });
  }

  // Vibrate if available
  if ("vibrate" in navigator) {
    navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
  }

  playAlarmSound();
}

// Show persistent tracking notification (silent, stays in notification bar)
export function showTrackingNotification(body: string, tripId: string): void {
  const reg = getSwRegistration();
  if (reg?.active) {
    reg.active.postMessage({
      type: "SHOW_TRACKING_NOTIFICATION",
      data: { body, tripId },
    });
  }
}

// Update the persistent tracking notification
export function updateTrackingNotification(body: string, tripId: string): void {
  const reg = getSwRegistration();
  if (reg?.active) {
    reg.active.postMessage({
      type: "UPDATE_TRACKING_NOTIFICATION",
      data: { body, tripId },
    });
  }
}

// Clear the persistent tracking notification
export function clearTrackingNotification(): void {
  const reg = getSwRegistration();
  if (reg?.active) {
    reg.active.postMessage({ type: "CLEAR_TRACKING_NOTIFICATION", data: {} });
  }
}

// Play alarm sound using Web Audio API oscillator (system-alarm-like beeping)
export function playAlarmSound(): void {
  if (alarmInterval) return; // Already playing

  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    // Create a beeping alarm pattern (like a system alarm clock)
    function beep() {
      if (!audioCtx) return;
      try {
        oscillatorNode = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();

        oscillatorNode.type = "square";
        oscillatorNode.frequency.value = 1000; // 1kHz - piercing alarm tone

        gainNode.gain.value = 1.0; // Max volume

        oscillatorNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillatorNode.start();
        oscillatorNode.stop(audioCtx.currentTime + 0.3); // 300ms beep
      } catch {
        // ignore
      }
    }

    // Immediate first beep
    beep();
    // Then beep every 600ms (300ms on, 300ms off)
    alarmInterval = setInterval(beep, 600);
  } catch {
    // Web Audio not available
  }
}

// Stop alarm sound
export function stopAlarmSound(): void {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if (oscillatorNode) {
    try {
      oscillatorNode.stop();
    } catch {
      // already stopped
    }
    oscillatorNode = null;
  }
  gainNode = null;

  // Stop vibration
  if ("vibrate" in navigator) {
    navigator.vibrate(0);
  }
}

// Wake Lock API - prevents device from sleeping during tracking
let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<void> {
  if (!("wakeLock" in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    // Re-acquire if released (e.g., tab switch)
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    // Wake lock not available or denied
  }
}

export async function releaseWakeLock(): Promise<void> {
  if (wakeLock) {
    try {
      await wakeLock.release();
    } catch {
      // ignore
    }
    wakeLock = null;
  }
}

// Re-acquire wake lock when tab becomes visible again
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !wakeLock) {
      requestWakeLock();
    }
  });
}
