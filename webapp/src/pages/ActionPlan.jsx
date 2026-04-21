import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '../api/client';
import { toPng } from 'html-to-image';

function titleCaseName(name) {
  return String(name || '')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getCommunityTheme(community, color, savedSlogan) {
  const normalized = String(community || '').trim().toLowerCase();
  const themes = {
    pasio: {
      label: 'PASIO',
      accent: '#C76A5C',
      slogan: 'Descubre y vive tu pasión.',
    },
    revo: {
      label: 'REVO',
      accent: '#7C8CA9',
      slogan: 'Somos luz que guía para forjar los sueños.',
    },
    kresko: {
      label: 'KRESKO',
      accent: '#7A6D90',
      slogan: 'Crecimiento integral que entrelaza ideas, pensamientos y actitudes.',
    },
    krei: {
      label: 'KREI',
      accent: '#79858B',
      slogan: 'Grandes ideas.',
    },
    forta: {
      label: 'FORTA',
      accent: '#7D6B5E',
      slogan: 'Fortaleza que hace que las acciones perduren, como el carácter fuerte para llegar lejos.',
    },
    spirita: {
      label: 'SPIRITA',
      accent: '#6B7FA5',
      slogan: 'Espíritu que inspira y genera cambio.',
    },
    reflekto: {
      label: 'REFLEKTO',
      accent: '#7C7AA8',
      slogan: 'Creatividad que fluye y se refleja.',
    },
    energio: {
      label: 'ENERGIO',
      accent: '#C77C52',
      slogan: 'Energía en constante movimiento, que impulsa y transforma.',
    },
    ekvilibro: {
      label: 'EKVILIBRO',
      accent: '#6E8C86',
      slogan: 'Simetría y balance en la vida.',
    },
    talenta: {
      label: 'TALENTA',
      accent: '#8C6E8E',
      slogan: 'Alcanzar el éxito con los talentos que tenemos.',
    },
  };

  const fallback = {
    label: community || 'Tec',
    accent: color || 'var(--coral-500)',
    slogan: savedSlogan || 'Ruta guiada para transformar esta sesión en un compromiso concreto.',
  };

  if (themes[normalized]) {
    return {
      ...themes[normalized],
      accent: color || themes[normalized].accent,
      slogan: savedSlogan || themes[normalized].slogan,
    };
  }

  return fallback;
}

export default function ActionPlan() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [showClosureLine, setShowClosureLine] = useState(false);
  const [resolvedCommunity, setResolvedCommunity] = useState(localStorage.getItem('navi_user_community') || '');
  const [resolvedCommunityColor, setResolvedCommunityColor] = useState(localStorage.getItem('navi_community_color') || '');
  const [syncWarning, setSyncWarning] = useState(localStorage.getItem('navi_goal_selection_warning') || '');
  const badgeRef = useRef(null);
  const metaPrioritaria = localStorage.getItem('meta_prioritaria') || 'No seleccionada';
  const metaComplementaria = localStorage.getItem('meta_complementaria') || 'No seleccionada';
  const metaTiempo = localStorage.getItem('meta_tiempo') || 'Flexible';
  const matricula = localStorage.getItem('navi_matricula') || '';
  const studentName = titleCaseName(localStorage.getItem('navi_user_name') || localStorage.getItem('navi_matricula') || 'Estudiante');
  const communityTheme = getCommunityTheme(
    resolvedCommunity,
    resolvedCommunityColor,
    localStorage.getItem('navi_community_slogan') || ''
  );
  const currentSessionLabel = new Date().toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowClosureLine(true), 450);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const warning = localStorage.getItem('navi_goal_selection_warning') || '';
    setSyncWarning(warning);
  }, []);

  useEffect(() => {
    async function hydrateCommunityContext() {
      if (!matricula || (resolvedCommunity && resolvedCommunityColor)) return;

      try {
        const { student, mentor } = await apiClient.post('findStudent', { matricula });
        const nextCommunity =
          student?.community ||
          student?.comunidad ||
          mentor?.community ||
          mentor?.comunidad ||
          '';
        const nextColor = mentor?.hex || '';

        if (nextCommunity) {
          localStorage.setItem('navi_user_community', nextCommunity);
          setResolvedCommunity(nextCommunity);
        }

        if (nextColor) {
          localStorage.setItem('navi_community_color', nextColor);
          document.documentElement.style.setProperty('--theme-color', nextColor);
          setResolvedCommunityColor(nextColor);
        }

        if (mentor?.slogan) {
          localStorage.setItem('navi_community_slogan', mentor.slogan);
        }

        if (mentor?.nombre || mentor?.name) {
          localStorage.setItem('navi_mentor_name', mentor.nombre || mentor.name);
        }
        if (student?.nombrepreferido || student?.preferredName || student?.nombre || student?.name) {
          localStorage.setItem(
            'navi_user_name',
            student?.nombrepreferido || student?.preferredName || student?.nombre || student?.name
          );
        }

      } catch (error) {
        console.error('[ActionPlan] could not hydrate community context:', error);
      }
    }

    hydrateCommunityContext();
  }, [matricula, resolvedCommunity, resolvedCommunityColor]);

  const formatGoalsForClipboard = () => {
    const metaPlan = localStorage.getItem('meta_plan') || '';
    const metaObstaculo = localStorage.getItem('meta_obstaculo') || '';
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
    const fileName = `Mis_Metas_Navi_${new Date().toLocaleDateString().replace(/\//g, '-')}.png`;
    const safariWindow = isSafari ? window.open('', '_blank', 'noopener,noreferrer') : null;

    setIsDownloading(true);
    setDownloadMessage('');

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const imageUrl = await toPng(badgeRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: 'transparent',
      });
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
    <div className="mx-auto max-w-5xl py-8 sm:py-12">
      {syncWarning ? (
        <div className="mb-6 rounded-[20px] border border-[rgba(210,106,92,0.18)] bg-[rgba(249,236,232,0.7)] px-4 py-3 text-sm font-medium text-[var(--ink-900)]">
          {syncWarning}
        </div>
      ) : null}
      <div className="mb-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="shell-panel rounded-[30px] border border-[rgba(15,76,129,0.12)] px-6 py-7 sm:px-8 sm:py-10">
          <p className="navi-eyebrow" style={{ color: 'var(--coral-500)' }}>faro · ruta guiada de acompa&ntilde;amiento</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--ink-900)] sm:text-5xl">
            Tu faro está trazado
          </h2>
          <p className="navi-prose mt-4 text-sm sm:text-base">
            Cerraste el recorrido con dos compromisos concretos y una estrategia para sostener tu avance cuando el semestre se complique.
          </p>
          <div className="mt-8 flex items-start gap-4 rounded-[22px] border border-[rgba(210,106,92,0.16)] bg-[rgba(249,236,232,0.5)] px-4 py-4 sm:px-5 sm:py-5">
            <div>
              <p className="font-display text-xl font-semibold text-[var(--ink-900)]">Ya tienes una ruta clara</p>
              <p className="mt-2 text-sm text-[var(--ink-700)]">
                Descárgalo. Es tuyo. Compártelo con tu mentor o mentora y vuelve a él cuando necesites orientarte.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[22px] border border-[rgba(15,76,129,0.1)] bg-white/70 px-4 py-5 sm:px-5">
            <p className="navi-eyebrow text-[var(--navy-500)]">Lo que ya cerraste hoy</p>
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
          <div className="absolute inset-x-8 top-6 h-24 rounded-full bg-[rgba(210,106,92,0.12)] blur-3xl" />
          <div
            ref={badgeRef}
            className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.16)] p-6 text-white shadow-[0_30px_70px_rgba(16,28,48,0.28)] transition-all duration-700 ease-out sm:rounded-[32px] sm:p-8"
            style={{
              background: `radial-gradient(circle at 52% 42%, color-mix(in srgb, ${communityTheme.accent} 26%, transparent) 0%, transparent 42%), radial-gradient(circle at 18% 14%, color-mix(in srgb, ${communityTheme.accent} 18%, transparent) 0%, transparent 28%), linear-gradient(180deg, color-mix(in srgb, ${communityTheme.accent} 16%, var(--navy-700)) 0%, color-mix(in srgb, ${communityTheme.accent} 24%, var(--navy-600)) 100%)`,
              transform: showClosureLine ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.97)',
              opacity: showClosureLine ? 1 : 0.8,
            }}
          >
            <div className="absolute right-0 top-0 h-48 w-48 translate-x-1/3 -translate-y-1/3 rounded-full bg-[rgba(255,255,255,0.08)] blur-3xl" />
            <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-1/3 translate-y-1/3 rounded-full bg-[rgba(210,106,92,0.16)] blur-3xl" />
            <div
              className="absolute left-1/2 top-[46%] h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
              style={{ background: communityTheme.accent, opacity: 0.14 }}
            />
            <div
              className="absolute left-[54%] top-[52%] h-[16rem] w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]"
              style={{ background: communityTheme.accent, opacity: 0.1 }}
            />
            <div
              className="absolute inset-x-0 top-0 h-24 border-b"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, ${communityTheme.accent} 82%, white 4%) 0%, color-mix(in srgb, ${communityTheme.accent} 56%, var(--navy-600)) 100%)`,
                borderColor: 'rgba(255,255,255,0.14)',
              }}
            />

            <div className="relative z-10">
              <div
                className="-mx-6 -mt-6 mb-6 px-6 py-4 sm:-mx-8 sm:-mt-8 sm:mb-7 sm:px-8 sm:py-5"
              >
                <p
                  className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-white sm:text-base sm:tracking-[0.26em]"
                >
                  COMUNIDAD {communityTheme.label}
                </p>
                <p className="mt-1.5 max-w-2xl font-editorial text-base italic text-[rgba(255,255,255,0.94)] sm:text-lg">
                  {communityTheme.slogan}
                </p>
              </div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.62)]">
                Mi sesión de mentoría · {currentSessionLabel}
              </p>
              <h3 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {studentName}
              </h3>

              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(255,255,255,0.58)]">
                  Me comprometí a
                </p>
                <p className="mt-4 max-w-3xl font-editorial text-[1.7rem] leading-[1.16] text-white sm:text-[2.35rem] sm:leading-[1.22]">
                  {metaPrioritaria}
                </p>
              </div>

              <div className="mt-8 border-t border-[rgba(255,255,255,0.12)] pt-6 sm:mt-10 sm:pt-7">
                <div className="grid gap-8 sm:grid-cols-[1.15fr_0.85fr] sm:items-end">
                  <div>
                    <p className="max-w-2xl text-base leading-relaxed text-[rgba(255,255,255,0.88)] sm:text-lg">
                      {metaComplementaria}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgba(255,255,255,0.66)] sm:text-sm sm:tracking-[0.18em]">
                      Por los próximos <span className="ml-2 text-xl tracking-normal text-white sm:text-2xl">{metaTiempo}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 border-t border-[rgba(255,255,255,0.12)] pt-6 text-center text-sm text-[rgba(255,255,255,0.76)]">
                <span>Mentoría completada</span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[22px] border border-[rgba(15,76,129,0.1)] bg-white/70 px-4 py-4 text-center shadow-[0_14px_30px_rgba(15,76,129,0.08)] sm:px-5">
            <p className="text-sm leading-6 text-[var(--ink-700)] sm:text-sm">
              Guarda esta versión para consultarla después o compartirla con tu mentor o mentora.
            </p>
            <div className="mt-3 overflow-hidden">
              <div
                className="mx-auto h-[3px] max-w-[14rem] rounded-full bg-[linear-gradient(90deg,var(--coral-500)_0%,rgba(210,106,92,0.16)_100%)] transition-transform duration-[900ms] ease-out"
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
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/seleccion-metas')}
                className="w-full text-base sm:text-lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Editar mis metas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
