import { useEffect, useRef, useState } from 'react';
import { workspaceClient } from '../../api/workspaceClient';

const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  const existing = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  });
}

export function GoogleWorkspaceLogin({ onAuthenticated, onError }) {
  const buttonRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const config = await workspaceClient.getConfig();
        if (!config.enabled || !config.clientId) {
          if (!cancelled) setStatus('disabled');
          return;
        }
        await loadGoogleIdentityScript();
        if (cancelled || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: config.clientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async ({ credential }) => {
            try {
              setStatus('authenticating');
              const result = await workspaceClient.login(credential);
              onAuthenticated(result.user || result);
            } catch (error) {
              setStatus('ready');
              onError(error);
            }
          },
        });
        buttonRef.current.replaceChildren();
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: Math.min(buttonRef.current.clientWidth || 360, 400),
          locale: 'es',
        });
        setStatus('ready');
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
          onError(error);
        }
      }
    }

    initialize();
    return () => {
      cancelled = true;
    };
  }, [onAuthenticated, onError]);

  if (status === 'disabled') {
    return <p className="text-sm text-[var(--ink-600)]">El acceso con Google Workspace aún no está configurado.</p>;
  }

  return (
    <div className="space-y-3">
      <div ref={buttonRef} className="min-h-11 w-full" />
      {status === 'loading' ? <p className="text-sm text-[var(--ink-600)]">Preparando acceso institucional…</p> : null}
      {status === 'authenticating' ? <p className="text-sm text-[var(--navy-600)]">Validando tu cuenta institucional…</p> : null}
      {status === 'error' ? <p className="text-sm text-[var(--coral-500)]">No pudimos cargar el acceso con Google.</p> : null}
    </div>
  );
}

