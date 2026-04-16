import { useEffect } from 'react';

export default function Layout({ children }) {
  useEffect(() => {
    const savedColor = localStorage.getItem('navi_community_color');
    if (savedColor) {
      document.documentElement.style.setProperty('--theme-color', savedColor);
    }
  }, []);
  return (
    <div className="min-h-screen w-full px-3 py-3 text-gray-900 selection:bg-brand-200 sm:px-5 sm:py-5">
      <main className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col rounded-[30px] border border-white/70 shell-panel sm:min-h-[calc(100vh-2.5rem)]">
        <div className="flex items-center justify-between px-6 pb-2 pt-6 sm:px-10">
          <div className="text-left">
            <p className="navi-eyebrow">Mentoría Estudiantil</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-2 text-[var(--navy-700)]">
                <span className="relative flex h-4 w-4 items-center justify-center" aria-hidden="true">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span className="absolute h-4 w-0.5 rounded-full bg-current/60" />
                  <span className="absolute w-4 h-0.5 rounded-full bg-current/60" />
                  <span className="absolute h-3.5 w-0.5 rotate-45 rounded-full bg-current/35" />
                  <span className="absolute h-3.5 w-0.5 -rotate-45 rounded-full bg-current/35" />
                </span>
                <span className="font-display text-[1.6rem] font-semibold tracking-[-0.04em]">faro</span>
              </div>
              <span className="h-4 w-px bg-[rgba(15,76,129,0.18)]" aria-hidden="true" />
              <p className="text-sm font-medium tracking-[0.01em] text-[var(--ink-700)]">
                ruta guiada de acompa&ntilde;amiento
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 pb-8 pt-2 sm:px-10 sm:pb-10">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>

        <footer className="px-6 pb-6 text-center text-sm text-[var(--ink-700)] sm:px-10">
          <p>Tecnológico de Monterrey &copy; {new Date().getFullYear()}</p>
        </footer>
      </main>
    </div>
  );
}
