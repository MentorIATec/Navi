import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRight, UserCircle } from 'lucide-react';
import { apiClient } from '../api/client';

export default function Welcome() {
  const navigate = useNavigate();
  const [matricula, setMatricula] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isValidMatricula = /^A[0-9]{8}$/i.test(matricula.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidMatricula) {
      setErrorMessage('Ingresa una matrícula válida con formato A12345678.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await apiClient.post('findStudent', { matricula: matricula.toUpperCase() });
      const student = response?.student;
      const mentor = response?.mentor;

      if (!student) {
        setErrorMessage('No encontramos tu matrícula en la base de Navi.');
        return;
      }

      const storedPreferredName =
        preferredName.trim() ||
        student.nombrepreferido ||
        student.preferredName ||
        '';
      const resolvedDisplayName =
        storedPreferredName ||
        student.nombre ||
        student.name ||
        '';

      localStorage.removeItem('navi_session_mode');
      localStorage.removeItem('navi_checked_in');
      localStorage.setItem('navi_matricula', student.matricula || matricula.toUpperCase());
      localStorage.setItem('navi_user_name', resolvedDisplayName);
      localStorage.setItem('navi_student_email', student.email || '');
      localStorage.setItem('navi_user_community', student.community || student.comunidad || '');

      if (mentor?.hex) {
        document.documentElement.style.setProperty('--theme-color', mentor.hex);
        localStorage.setItem('navi_community_color', mentor.hex);
        localStorage.setItem('navi_mentor_name', mentor.nombre || mentor.name || '');
      }

      if (preferredName.trim() && preferredName.trim() !== (student.nombrepreferido || student.preferredName || '')) {
        await apiClient.post('updateStudent', {
          matricula: student.matricula || matricula.toUpperCase(),
          preferredName: preferredName.trim(),
        });
      }

      navigate('/test');
    } catch (error) {
      console.error('No se pudo resolver la matrícula en backend:', error);
      setErrorMessage('No pudimos validar tu matrícula en este momento. Intenta de nuevo en unos minutos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="grid min-h-[72vh] items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
      <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--navy-700)_0%,var(--navy-500)_62%,color-mix(in_srgb,var(--theme-color)_55%,var(--navy-500))_100%)] px-7 py-10 text-white shadow-[0_26px_60px_rgba(16,38,69,0.28)] sm:px-10 sm:py-12">
        <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-[rgba(210,106,92,0.26)] blur-3xl" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[rgba(255,255,255,0.08)] blur-3xl" />
        <div className="absolute inset-y-0 right-10 hidden w-px bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.16)_22%,rgba(255,255,255,0.05)_78%,transparent_100%)] lg:block" />
        <div className="absolute bottom-10 right-10 hidden h-40 w-40 rounded-full border border-white/8 lg:block" />
        <div className="absolute bottom-18 right-18 hidden h-24 w-24 rounded-full border border-white/10 lg:block" />

        <div className="relative z-10 max-w-xl">
          <p className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.28em] text-white/62">
            Tu punto de partida
          </p>
          <h1 className="font-display text-5xl font-bold tracking-[-0.05em] text-white sm:text-6xl">
            Descubre dónde estás y hacia dónde quieres avanzar.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-white/78">
            Este primer paso te ayudará a ordenar ideas, identificar lo importante y llegar mejor preparado a tu mentoría.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-7 sm:p-9">
          <div className="mb-8">
            <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.04em] text-[var(--navy-700)]">
              Ingresa tu matrícula
            </h2>
            <p className="mt-3 navi-prose text-base leading-7">
              Comienza aquí para responder tu evaluación y prepararte para la mentoría.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="matricula" className="text-sm font-semibold text-[var(--ink-900)]">
                Matrícula Estudiantil
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--ink-700)]">
                  <UserCircle className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  id="matricula"
                  placeholder="Ej. A01234567"
                  className="block w-full rounded-[20px] border border-[rgba(15,76,129,0.16)] bg-white/88 p-4 pl-12 text-lg font-medium text-[var(--ink-900)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition-all uppercase placeholder:text-[var(--ink-700)] focus:border-[var(--theme-color)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,76,129,0.08)]"
                  value={matricula}
                  onChange={(e) => {
                    setMatricula(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  maxLength={9}
                  required
                />
              </div>
              {errorMessage ? (
                <p className="rounded-2xl bg-[var(--coral-100)] px-4 py-3 text-sm font-medium text-[var(--coral-500)]">
                  {errorMessage}
                </p>
              ) : (
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ink-700)]">
                  Formato esperado: A seguido de 8 dígitos
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label htmlFor="preferredName" className="text-sm font-semibold text-[var(--ink-900)]">
                ¿Cómo deseas que te llamen?
              </label>
              <input
                type="text"
                id="preferredName"
                placeholder="Nombre de pila o nombre preferido"
                className="block w-full rounded-[20px] border border-[rgba(15,76,129,0.16)] bg-white/88 p-4 text-lg font-medium text-[var(--ink-900)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition-all placeholder:text-[var(--ink-700)] focus:border-[var(--theme-color)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,76,129,0.08)]"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
              />
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ink-700)]">
                Opcional. Lo usaremos para personalizar tu experiencia en Navi.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full group"
              size="lg"
              disabled={!isValidMatricula}
              isLoading={isLoading}
            >
              Comenzar Diagnóstico
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
