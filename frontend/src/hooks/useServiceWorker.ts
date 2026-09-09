import { useState, useEffect, useCallback } from 'react';

interface SWState {
  waitingWorker: ServiceWorker | null;
  updateAvailable: boolean;
}

export function useServiceWorker() {
  const [state, setState] = useState<SWState>({
    waitingWorker: null,
    updateAvailable: false,
  });

  // Called when the user clicks "Update Now"
  const applyUpdate = useCallback(() => {
    const { waitingWorker } = state;
    if (waitingWorker) {
      // Tell the waiting SW to take over
      waitingWorker.postMessage('SKIP_WAITING');
    }
    // Reload once the new SW is controlling the page
    window.location.reload();
  }, [state]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleStateChange = (sw: ServiceWorker) => {
      if (sw.state === 'installed') {
        // A new SW is waiting — there's an update ready
        setState({ waitingWorker: sw, updateAvailable: true });
      }
    };

    const onUpdateFound = (registration: ServiceWorkerRegistration) => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', () => handleStateChange(newWorker));
    };

    // Register the service worker
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[SW] Registered:', registration.scope);

        // If there's already a waiting worker on load, show the prompt
        if (registration.waiting) {
          setState({ waitingWorker: registration.waiting, updateAvailable: true });
        }

        // Detect future updates
        registration.addEventListener('updatefound', () => onUpdateFound(registration));

        // Poll for updates every 60 seconds (catches deploys while app is open)
        const intervalId = setInterval(() => {
          registration.update().catch(() => {/* ignore offline errors */});
        }, 60_000);

        return () => clearInterval(intervalId);
      })
      .catch((err) => console.error('[SW] Registration failed:', err));

    // When the new SW takes control, reload the page
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, []);

  return { updateAvailable: state.updateAvailable, applyUpdate };
}
