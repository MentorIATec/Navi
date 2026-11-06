import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { readJourney, readConfirmedPlan } from '../utils/journeyIntegrity';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { exportKeepsake } from '../utils/exportKeepsake';
import { GoalKeepsake } from '../components/GoalKeepsake';
import { getCommunityTheme } from '../utils/communityTheme';
import { keepsakeFilename } from '../utils/keepsakeFilename';

function titleCaseName(name) {
  return String(name || '')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}


export default function ActionPlan() {
  const journey = readJourney(sessionStorage);
  const receipt = readConfirmedPlan(sessionStorage, journey);
  if (!receipt) return <Navigate to={journey ? '/seleccion-metas' : '/check-in'} replace />;
  return <ConfirmedActionPlan journey={journey} receipt={receipt} />;
}

function ConfirmedActionPlan({ journey, receipt }) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [showClosureLine, setShowClosureLine] = useState(false);
  const badgeRef = useRef(null);
  const metaPrioritaria = receipt.payload.metaPrioritaria;
  const metaComplementaria = receipt.payload.metaComplementaria;
  const metaTiempo = receipt.payload.tiempo;
  const studentName = titleCaseName(journey.displayName || journey.matricula);
  const communityTheme = getCommunityTheme(
    journey.community, journey.color, journey.slogan
  );
  const currentSessionLabel = new Date(receipt.completedAt || receipt.confirmedAt).toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowClosureLine(true), 450);
    return () => clearTimeout(timer);
  }, []);

  const formatGoalsForClipboard = () => {
    const metaPlan = receipt.payload.plan || '';
    const metaObstaculo = receipt.payload.obstaculo || '';
    return `PLAN DE MENTORÍA\n\nMETA PRIORITARIA:\n${metaPrioritaria}\n\nMETA COMPLEMENTARIA:\n${metaComplementaria}\n\nVENTANA DE TIEMPO:\n${metaTiempo}\n\nOBSTÁCULO PRINCIPAL:\n${metaObstaculo}\n\nESTRATEGIA SI-ENTONCES:\n${metaPlan}`;
  };

  const handleCopyAndMiTec = () => {
    navigator.clipboard.writeText(formatGoalsForClipboard());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    // Open MiTec
    window.open("https://mitec.itesm.mx", "_blank");
  };

  const downloadBadge = async () => {
    if (!badgeRef.current) return;

    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome|Chromium|Android/i.test(navigator.userAgent);
    const fileName = keepsakeFilename();
    const safariWindow = isSafari ? window.open('', '_blank', 'noopener,noreferrer') : null;

    setIsDownloading(true);
    setDownloadMessage('');

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const imageUrl = await exportKeepsake(badgeRef.current);
      if (!imageUrl) throw new Error('No se pudo generar la imagen del plan.');

      if (isSafari && safariWindow) {
        safariWindow.location.href = imageUrl;
        setDownloadMessage('Safari abrió la imagen en otra pestaña para que puedas guardarla.');
      } else {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      if (safariWindow && !safariWindow.closed) {
        safariWindow.close();
      }
      console.error('Error al generar imagen', err);
      setDownloadMessage('No pudimos descargar la tarjeta en este intento. Intenta de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="clarity-plan mx-auto max-w-5xl py-8 sm:py-12">
      <div className="mb-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="shell-panel rounded-[18px] border border-[rgba(15,76,129,0.12)] px-6 py-7 sm:px-8 sm:py-10">
          <p className="navi-eyebrow" style={{ color: 'var(--coral-500)' }}>faro · ruta guiada de acompa&ntilde;amiento</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--ink-900)] sm:text-5xl">
            Tu faro está trazado
          </h2>
          <p className="navi-prose mt-4 text-sm sm:text-base">
            Cerraste el recorrido con dos compromisos concretos y una estrategia para sostener tu avance cuando el semestre se complique.
          </p>
          <div className="mt-8 flex items-start gap-4 rounded-[18px] border border-[rgba(210,106,92,0.16)] bg-[rgba(249,236,232,0.5)] px-4 py-4 sm:px-5 sm:py-5">
            <div>
              <p className="font-display text-xl font-semibold text-[var(--ink-900)]">Ya tienes una ruta clara</p>
              <p className="mt-2 text-sm text-[var(--ink-700)]">
                Descárgalo. Es tuyo. Compártelo con tu mentor o mentora y vuelve a él cuando necesites orientarte.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[18px] border border-[rgba(15,76,129,0.1)] bg-white/70 px-4 py-5 sm:px-5">
            <p className="navi-eyebrow text-[var(--navy-500)]">Lo que acordaste en esta sesión</p>
            <div className="mt-4 space-y-3 text-sm text-[var(--ink-700)]">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--coral-500)]" />
                <p>Una meta prioritaria concreta para avanzar en tu semestre.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--coral-500)]" />
                <p>Una meta complementaria para sostener tu bienestar.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--coral-500)]" />
                <p>Una respuesta pensada para cuando aparezca el obstáculo.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative">
          
          <GoalKeepsake
            ref={badgeRef}
            name={studentName}
            community={communityTheme}
            sessionLabel={currentSessionLabel}
            primary={metaPrioritaria}
            complementary={metaComplementaria}
            horizon={metaTiempo}
            strategy={receipt.payload.plan || ''}
          />

          <div className="mt-5 rounded-[18px] border border-[rgba(15,76,129,0.1)] bg-white/70 px-4 py-4 text-center  sm:px-5">
            <p className="text-sm leading-6 text-[var(--ink-700)] sm:text-sm">
              Guarda esta versión para consultarla después o compartirla con tu mentor o mentora.
            </p>
            <div className="mt-3 overflow-hidden">
              <div
                className="mx-auto h-[3px] max-w-[14rem] rounded-full bg-[var(--surface-raised)] transition-transform duration-[900ms] ease-out"
                style={{ transform: showClosureLine ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left center' }}
              />
            </div>
            <div className="mt-3 flex justify-center">
              <Button
                variant="ghost"
                className="text-[var(--navy-500)] hover:text-[var(--navy-700)]"
                onClick={downloadBadge}
                isLoading={isDownloading}
              >
                Descargar mi plan
              </Button>
            </div>
          </div>
          {downloadMessage ? (
            <p className="mt-2 text-center text-sm text-[var(--ink-700)]">
              {downloadMessage}
            </p>
          ) : null}
        </section>
      </div>
      <Card className="border-[rgba(15,76,129,0.12)]">
        <CardContent className="p-8 sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8">
            <div>
              <p className="navi-eyebrow">El siguiente paso</p>
              <h3 className="mt-3 font-display text-[2rem] font-semibold leading-tight text-[var(--ink-900)] sm:text-3xl">
                Registra este plan en MiVidaTec
              </h3>
              <p className="mt-4 text-sm leading-7 text-[var(--ink-700)] sm:text-base">
                Copia este plan y pégalo en <strong>MiVidaTec &gt; Metas de Plan de Vida</strong>.
                Así tu compromiso queda registrado también en tu ruta institucional.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Button
                size="lg"
                className="w-full text-base sm:text-lg"
                onClick={handleCopyAndMiTec}
              >
                {copied ? (
                  <>
                    <span className="sm:hidden">Copiado. Abriendo...</span>
                    <span className="hidden sm:inline">Copiado. Abriendo MiVidaTec...</span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden">Abrir MiVidaTec</span>
                    <span className="hidden sm:inline">Abrir MiVidaTec y copiar mi plan</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
