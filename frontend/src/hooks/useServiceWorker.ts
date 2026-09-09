import { useState, useEffect, useCallback, useRef } from 'react';

interface SWState {
  waitingWorker: ServiceWorker | null;
  updateAvailable: boolean;
}

export function useServiceWorker() {
  const [state, setState] = useState<SWState>({
    waitingWorker: null,
    updateAvailable: false,
  });

  // Track if the user has already clicked "Update" to avoid double-reload
  const isUpdating = useRef(false);

  // Called when the user clicks "Update Now"
  const applyUpdate = useCallback(() => {
    if (isUpdating.current) return;
    isUpdating.current = true;

    const { waitingWorker } = state;
    if (waitingWorker) {
      // Tell the waiting SW to skip waiting and take over
      waitingWorker.postMessage('SKIP_WAITING');
    } else {
      // No waiting worker — just reload to get fresh assets
      window.location.reload();
    }
  }, [state]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let cleanupInterval: ReturnType<typeof setInterval> | null = null;

    const setUpdateReady = (sw: ServiceWorker) => {
      console.log('[SW] Update available — waiting worker ready.');
      setState({ waitingWorker: sw, updateAvailable: true });
    };

    const trackInstalling = (sw: ServiceWorker) => {
      sw.addEventListener('statechange', () => {
        // When a newly installed SW moves to "installed" state it is now "waiting"
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          setUpdateReady(sw);
        }
      });
    };

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[SW] Registered:', registration.scope);

        // Case 1: A new SW is already waiting when the page loads
        if (registration.waiting && navigator.serviceWorker.controller) {
          setUpdateReady(registration.waiting);
        }

        // Case 2: A new SW starts installing while the app is open
        if (registration.installing) {
          trackInstalling(registration.installing);
        }

        // Case 3: Catch future update-found events (e.g. after poll)
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) trackInstalling(newWorker);
        });

        // Poll for updates every 30 seconds while the app is open
        cleanupInterval = setInterval(() => {
          registration.update().catch(() => { /* ignore offline errors */ });
        }, 30_000);
      })
      .catch((err) => console.error('[SW] Registration failed:', err));

    // When the new SW takes control (after SKIP_WAITING), reload the page
    // Guard with isUpdating so only deliberate updates trigger reload
    const onControllerChange = () => {
      if (isUpdating.current) {
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      if (cleanupInterval) clearInterval(cleanupInterval);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  return { updateAvailable: state.updateAvailable, applyUpdate };
}
