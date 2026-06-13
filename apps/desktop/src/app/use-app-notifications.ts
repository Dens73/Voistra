import { useCallback, useEffect, useRef, useState } from 'react';

import type { AppNotification } from './types';

type NotificationSound = 'soft' | 'alert';

function playNotificationSound(kind: NotificationSound = 'soft') {
  try {
    const AudioContextCtor =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const duration = kind === 'alert' ? 0.35 : 0.25;

    oscillator.type = kind === 'alert' ? 'triangle' : 'sine';
    oscillator.frequency.value = kind === 'alert' ? 720 : 540;
    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(context.destination);

    const now = context.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration - 0.03);
    oscillator.start(now);
    oscillator.stop(now + duration);

    window.setTimeout(() => {
      void context.close().catch(() => undefined);
    }, 500);
  } catch {
    // Sound feedback should never break the main app flow.
  }
}

export function useAppNotifications() {
  const [toast, setToast] = useState<string>('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const toastTimeoutRef = useRef<number | null>(null);

  const pushNotification = useCallback((title: string, body: string, sound: NotificationSound = 'soft') => {
    setNotifications((current) =>
      [
        {
          id: crypto.randomUUID(),
          title,
          body,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 20),
    );
    playNotificationSound(sound);
  }, []);

  const pushToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setToast('');
      toastTimeoutRef.current = null;
    }, 2400);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return {
    clearNotifications,
    notifications,
    pushNotification,
    pushToast,
    toast,
  };
}
