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
        <div className="flex flex-col gap-4 px-5 pb-2 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:pt-6">
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <div className="flex shrink-0 items-center gap-2 text-[var(--navy-700)]">
              <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-current" />
                <span className="absolute h-5 w-0.5 rounded-full bg-current/60" />
                <span className="absolute w-5 h-0.5 rounded-full bg-current/60" />
                <span className="absolute h-4 w-0.5 rotate-45 rounded-full bg-current/35" />
                <span className="absolute h-4 w-0.5 -rotate-45 rounded-full bg-current/35" />
              </span>
              <span className="font-display text-[1.95rem] font-semibold tracking-[-0.04em] sm:text-[2rem]">faro</span>
            </div>
            <span className="mt-1 h-10 w-px shrink-0 bg-[rgba(15,76,129,0.18)] sm:mt-0 sm:h-5" aria-hidden="true" />
            <p className="min-w-0 text-[0.95rem] font-medium leading-tight tracking-[0.01em] text-[var(--ink-700)] sm:text-base sm:leading-normal">
              ruta guiada de acompa&ntilde;amiento
            </p>
          </div>
          <p className="navi-eyebrow self-end text-right sm:self-auto">Mentoría Estudiantil</p>
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
