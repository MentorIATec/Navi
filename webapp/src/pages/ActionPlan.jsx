import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ExternalLink, Check, Download, CheckCircle2, ArrowLeft, Compass, Sparkle } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function ActionPlan() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showClosureLine, setShowClosureLine] = useState(false);
  const badgeRef = useRef(null);

  const metaPrioritaria = localStorage.getItem('meta_prioritaria') || 'No seleccionada';
  const metaComplementaria = localStorage.getItem('meta_complementaria') || 'No seleccionada';
  const metaTiempo = localStorage.getItem('meta_tiempo') || 'Flexible';
  const metaPlan = localStorage.getItem('meta_plan') || '';
  const metaObstaculo = localStorage.getItem('meta_obstaculo') || '';
  const studentName = localStorage.getItem('navi_user_name') || localStorage.getItem('navi_matricula') || 'Estudiante';
  const currentSemester = `Periodo ${new Date().getFullYear()}`;

  useEffect(() => {
    const timer = setTimeout(() => setShowClosureLine(true), 450);
    return () => clearTimeout(timer);
  }, []);

  const formatGoalsForClipboard = () => {
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
    try {
      const canvas = await html2canvas(badgeRef.current, { scale: 2, backgroundColor: null });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Mis_Metas_Navi_${new Date().toLocaleDateString().replace(/\//g, '-')}.png`;
      link.click();
    } catch (err) {
      console.error("Error al generar imagen", err);
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-8 sm:py-12">
      <div className="mb-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="shell-panel rounded-[30px] border border-[rgba(15,76,129,0.12)] px-7 py-8 sm:px-8 sm:py-10">
          <p className="navi-eyebrow" style={{ color: 'var(--coral-500)' }}>Cierre de ciclo</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--ink-900)] sm:text-5xl">
            Tu plan ya tiene forma
          </h2>
          <p className="navi-prose mt-4 text-sm sm:text-base">
            Cerraste el recorrido de mentoría con metas concretas y una estrategia clara para sostenerlas en el tiempo.
          </p>
          <div className="mt-8 flex items-start gap-4 rounded-[22px] border border-[rgba(210,106,92,0.16)] bg-[rgba(249,236,232,0.5)] px-5 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgba(210,106,92,0.14)] text-[var(--coral-500)]">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-[var(--ink-900)]">Compromiso definido</p>
              <p className="mt-2 text-sm text-[var(--ink-700)]">
                Guarda este plan, compártelo con tu mentor y úsalo como referencia de seguimiento durante el semestre.
              </p>
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="absolute inset-x-8 top-6 h-24 rounded-full bg-[rgba(210,106,92,0.12)] blur-3xl" />
          <div
            ref={badgeRef}
            className="relative overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.16)] bg-[linear-gradient(180deg,var(--navy-700)_0%,var(--navy-600)_100%)] p-8 text-white shadow-[0_30px_70px_rgba(16,28,48,0.28)] transition-all duration-700 ease-out"
            style={{
              transform: showClosureLine ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.97)',
              opacity: showClosureLine ? 1 : 0.8,
            }}
          >
            <div className="absolute right-0 top-0 h-48 w-48 translate-x-1/3 -translate-y-1/3 rounded-full bg-[rgba(255,255,255,0.08)] blur-3xl" />
            <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-1/3 translate-y-1/3 rounded-full bg-[rgba(210,106,92,0.16)] blur-3xl" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(255,255,255,0.68)]">
                    Brújula de Mentoría · Tecnológico de Monterrey · {currentSemester}
                  </p>
                  <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {studentName}
                  </h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] px-4 py-2 text-sm text-[rgba(255,255,255,0.82)]">
                  <CheckCircle2 className="h-4 w-4" />
                  Plan completado
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                <div className="rounded-[24px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.07)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.62)]">
                    Meta prioritaria
                  </p>
                  <p className="mt-3 font-editorial text-xl leading-relaxed text-white">
                    {metaPrioritaria}
                  </p>
                </div>

                <div className="rounded-[24px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.07)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.62)]">
                    Meta complementaria
                  </p>
                  <p className="mt-3 font-editorial text-xl leading-relaxed text-white">
                    {metaComplementaria}
                  </p>
                </div>

                {metaPlan ? (
                  <div className="rounded-[24px] border border-[rgba(255,255,255,0.12)] bg-[rgba(6,18,34,0.22)] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.62)]">
                      Estrategia si-entonces
                    </p>
                    <p className="mt-3 font-editorial text-lg italic leading-relaxed text-[rgba(255,255,255,0.92)]">
                      {metaPlan}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-8 grid gap-4 border-t border-[rgba(255,255,255,0.12)] pt-6 sm:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.62)]">
                    Ventana de tiempo
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{metaTiempo}</p>
                </div>
                {metaObstaculo ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.62)]">
                      Obstáculo principal
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[rgba(255,255,255,0.84)]">
                      {metaObstaculo}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-8 flex items-center justify-between gap-4 text-sm text-[rgba(255,255,255,0.72)]">
                <span>KREI · {new Date().toLocaleDateString('es-MX')}</span>
                <span className="inline-flex items-center gap-2">
                  <Sparkle className="h-4 w-4 text-[var(--coral-500)]" />
                  Mentoría concluida
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden px-4">
            <div
              className="h-[3px] rounded-full bg-[linear-gradient(90deg,var(--coral-500)_0%,rgba(210,106,92,0.16)_100%)] transition-transform duration-[900ms] ease-out"
              style={{ transform: showClosureLine ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left center' }}
            />
          </div>

          <div className="mt-5 flex justify-center">
            <Button variant="ghost" className="text-[var(--navy-500)] hover:text-[var(--navy-700)]" onClick={downloadBadge}>
              <Download className="mr-2 h-4 w-4" />
              Descargar mi plan
            </Button>
          </div>
        </section>
      </div>
      <Card className="border-[rgba(15,76,129,0.12)]">
        <CardContent className="p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="navi-eyebrow">Siguiente acción</p>
              <h3 className="mt-3 font-display text-3xl font-semibold text-[var(--ink-900)]">
                Llévalo a tu registro institucional
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[var(--ink-700)] sm:text-base">
                Copiaremos tu plan automáticamente para que lo pegues en <strong>MiVidaTec &gt; Metas de Plan de Vida</strong>.
                Así dejas trazado este compromiso también dentro de tu seguimiento institucional.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Button
                size="lg"
                className="w-full"
                onClick={handleCopyAndMiTec}
              >
                {copied ? <Check className="mr-2 h-5 w-5" /> : <ExternalLink className="mr-2 h-5 w-5" />}
                {copied ? 'Copiado. Abriendo MiVidaTec...' : 'Guardar en MiVidaTec'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/seleccion-metas')}
                className="w-full"
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
