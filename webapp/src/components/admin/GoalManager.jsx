import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus, Trash2, Save, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { apiClient } from '../../api/client';
import { cn } from '../../utils/cn';

const DIMENSIONS = ['financiera', 'intelectual', 'emocional', 'social', 'fisica', 'espiritual', 'ocupacional'];
const STAGES = ['exploracion', 'enfoque', 'multietapa'];
const TOPICS = ['academico', 'carrera', 'practicas', 'servicio social', 'bienestar cotidiano', 'integracion social', 'requisitos de egreso', 'organizacion personal'];
const DIFFICULTY = ['baja', 'media', 'alta'];
const FOLLOW_UP = ['ninguno', 'al final del periodo', 'quincenal', 'por sesión'];

function normalizeCatalogItem(raw, fallbackIndex = 0) {
  const normalizedStage = String(raw.etapa || raw.Etapa || '').trim().toLowerCase();
  const rawTopic = String(raw.temaoperativo || raw.temaOperativo || raw.TemaOperativo || '').trim().toLowerCase();
  const normalizedTopic = rawTopic === 'servicio' ? 'servicio social' : rawTopic;
  const rawDimension = String(raw.dimension || raw.Dimension || '').trim().toLowerCase();
  const normalizedDimension = normalizedTopic === 'servicio social' ? 'ocupacional' : rawDimension;
  return {
    id: String(raw.id || raw.Id || `goal-${fallbackIndex}`),
    temaoperativo: normalizedTopic,
    dimension: normalizedDimension,
    etapa: normalizedStage === 'longitudinal' ? 'multietapa' : normalizedStage,
    metabase: String(raw.metabase || raw.metaBase || raw.MetaBase || '').trim(),
    pasosbase: String(raw.pasosbase || raw.pasosBase || raw.PasosBase || '').trim(),
    horizontesugerido: String(raw.horizontesugerido || raw.horizonteSugerido || raw.HorizonteSugerido || '').trim(),
    indicadorlogro: String(raw.indicadorlogro || raw.indicadorLogro || raw.IndicadorLogro || '').trim(),
    cuandousarla: String(raw.cuandousarla || raw.cuandoUsarla || raw.CuandoUsarla || '').trim(),
    niveldificultad: String(raw.niveldificultad || raw.nivelDificultad || raw.NivelDificultad || 'media').trim().toLowerCase(),
    frecuenciaseguimiento: String(raw.frecuenciaseguimiento || raw.frecuenciaSeguimiento || raw.FrecuenciaSeguimiento || 'por sesión').trim().toLowerCase(),
    conexiondiagnostico: String(raw.conexiondiagnostico || raw.conexionDiagnostico || raw.ConexionDiagnostico || '').trim(),
    preguntasparaafinar: String(raw.preguntasparaafinar || raw.preguntasParaAfinar || raw.PreguntasParaAfinar || '').trim(),
    activa: String(raw.activa || raw.Activa || 'Si').trim() || 'Si',
  };
}

function isActiveCatalogItem(item) {
  return String(item.activa || 'Si').trim().toLowerCase() !== 'no';
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--navy-600)]">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-[var(--ink-700)]">{hint}</span> : null}
    </label>
  );
}

function TextInput(props) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={cn(
        'w-full rounded-xl border border-[rgba(15,76,129,0.12)] bg-white px-4 py-2.5 text-sm text-[var(--ink-900)] focus:border-[var(--navy-500)] focus:outline-none focus:ring-2 focus:ring-[rgba(15,76,129,0.12)]',
        className
      )}
    />
  );
}

function TextArea(props) {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={cn(
        'w-full rounded-xl border border-[rgba(15,76,129,0.12)] bg-white px-4 py-3 text-sm text-[var(--ink-900)] focus:border-[var(--navy-500)] focus:outline-none focus:ring-2 focus:ring-[rgba(15,76,129,0.12)]',
        className
      )}
    />
  );
}

function Select({ options, includeAll = false, allLabel = 'Todas', ...props }) {
  const { className, ...rest } = props;
  return (
    <select
      {...rest}
      className={cn(
        'w-full rounded-xl border border-[rgba(15,76,129,0.12)] bg-white px-4 py-2.5 text-sm text-[var(--ink-900)] focus:border-[var(--navy-500)] focus:outline-none focus:ring-2 focus:ring-[rgba(15,76,129,0.12)]',
        className
      )}
    >
      {includeAll ? <option value="all">{allLabel}</option> : <option value="">Seleccionar</option>}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function stageLabel(stage) {
  return stage === 'multietapa' ? 'multietapa' : stage;
}

function isMultietapaCandidate(item) {
  return (
    item.etapa === 'multietapa' ||
    ['emocional', 'social', 'espiritual'].includes(item.dimension) ||
    ['bienestar cotidiano', 'integracion social'].includes(item.temaoperativo)
  );
}

export default function GoalManager() {
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [dimensionFilter, setDimensionFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.post('getGoalsCatalog');
      const items = (data.items || []).map((item, index) => normalizeCatalogItem(item, index));
      setCatalog(items);
      setSelectedId((current) => current || items[0]?.id || null);
      setFeedback(null);
    } catch (error) {
      console.error(error);
      setFeedback({ tone: 'error', message: 'No fue posible cargar el catálogo curado.' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      if (!isActiveCatalogItem(item)) return false;
      const matchesStage =
        stageFilter === 'all' ||
        (stageFilter === 'multietapa' ? isMultietapaCandidate(item) : item.etapa === stageFilter);
      const matchesDimension = dimensionFilter === 'all' || item.dimension === dimensionFilter;
      const matchesTopic = topicFilter === 'all' || item.temaoperativo === topicFilter;
      const haystack = [
        item.id,
        item.metabase,
        item.temaoperativo,
        item.dimension,
        item.conexiondiagnostico,
      ]
        .join(' ')
        .toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.trim().toLowerCase());
      return matchesStage && matchesDimension && matchesTopic && matchesSearch;
    });
  }, [catalog, stageFilter, dimensionFilter, topicFilter, searchTerm]);

  const selectedItem = useMemo(
    () => filteredCatalog.find((item) => item.id === selectedId) || catalog.find((item) => item.id === selectedId) || null,
    [filteredCatalog, catalog, selectedId]
  );

  const updateItem = (id, field, value) => {
    setCatalog((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    const id = `goal-${Date.now()}`;
    const draft = {
      id,
      temaoperativo: '',
      dimension: '',
      etapa: stageFilter !== 'all' ? stageFilter : 'exploracion',
      metabase: '',
      pasosbase: '',
      horizontesugerido: '',
      indicadorlogro: '',
      cuandousarla: '',
      niveldificultad: 'media',
      frecuenciaseguimiento: 'por sesión',
      conexiondiagnostico: '',
      preguntasparaafinar: '',
      activa: 'Si',
    };
    setCatalog((prev) => [draft, ...prev]);
    setSelectedId(id);
    setFeedback({ tone: 'success', message: 'Se abrió una nueva meta borrador para captura ligera.' });
  };

  const removeItem = (id) => {
    setCatalog((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) {
      const next = filteredCatalog.find((item) => item.id !== id) || catalog.find((item) => item.id !== id) || null;
      setSelectedId(next?.id || null);
    }
    setPendingDelete(null);
    setFeedback({ tone: 'success', message: 'La meta salió del catálogo curado.' });
  };

  const saveCatalog = async (message) => {
    setIsSaving(true);
    try {
      await apiClient.post('saveGoalsCatalog', { items: catalog });
      setFeedback({ tone: 'success', message });
    } catch (error) {
      setFeedback({ tone: 'error', message: `No fue posible guardar el catálogo: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSelected = async () => {
    await saveCatalog('La meta seleccionada quedó guardada dentro del catálogo.');
  };

  const handleSaveAll = async () => {
    await saveCatalog('El catálogo curado quedó guardado.');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--navy-500)]">
        <div className="flex flex-col items-center">
          <Loader2 className="mb-4 h-10 w-10 animate-spin" />
          <p className="font-medium">Cargando catálogo curado…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      {feedback ? (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            feedback.tone === 'success'
              ? 'border-[rgba(15,76,129,0.14)] bg-[rgba(15,76,129,0.06)] text-[var(--navy-700)]'
              : 'border-[rgba(210,106,92,0.16)] bg-[rgba(210,106,92,0.08)] text-[var(--ink-900)]'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <p>{feedback.message}</p>
            <button
              onClick={() => setFeedback(null)}
              className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] opacity-70 hover:opacity-100"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="mb-4 rounded-2xl border border-[rgba(210,106,92,0.16)] bg-[rgba(210,106,92,0.08)] px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--ink-900)]">Eliminar meta del catálogo</p>
              <p className="mt-1 text-sm text-[var(--ink-700)]">Esta acción quitará la meta {pendingDelete} del banco curado.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPendingDelete(null)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={() => removeItem(pendingDelete)}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--ink-900)]">Catálogo de metas</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--ink-700)]">
            Cada meta funciona como punto de partida editable. La dimensión conserva el marco Tec; el tema operativo organiza la conversación en sesión.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" /> Añadir meta
          </Button>
          <Button onClick={handleSaveAll} isLoading={isSaving}>
            <Save className="mr-2 h-4 w-4" /> Guardar catálogo
          </Button>
        </div>
      </div>

      <Card className="mb-6 border-[rgba(15,76,129,0.12)] shadow-sm">
        <CardContent className="p-4 md:p-5">
          <div className="mb-3 flex items-center gap-2 text-[var(--navy-600)]">
            <SlidersHorizontal className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Filtros del banco</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-700)]" />
              <TextInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ID, meta, dimensión o diagnóstico"
                className="pl-10"
              />
            </div>
            <Select includeAll allLabel="Todas las etapas" options={STAGES} value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} />
            <Select includeAll allLabel="Todas las dimensiones" options={DIMENSIONS} value={dimensionFilter} onChange={(e) => setDimensionFilter(e.target.value)} />
            <Select includeAll allLabel="Todos los temas" options={TOPICS} value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} />
          </div>
          <p className="mt-3 text-sm text-[var(--ink-700)]">
            Mostrando {filteredCatalog.length} de {catalog.length} metas
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:items-start xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
        <Card className="flex flex-col self-start overflow-hidden border-[rgba(15,76,129,0.12)] shadow-sm xl:h-[calc(100vh-17rem)]">
          <div className="border-b border-[rgba(15,76,129,0.08)] bg-[rgba(15,76,129,0.04)] px-5 py-4">
            <div className="grid grid-cols-[120px_136px_minmax(0,1fr)] gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--navy-600)]">
              <span>ID</span>
              <span>Dimensión</span>
              <span>Meta base</span>
            </div>
          </div>
          <CardContent className="min-h-[420px] flex-1 overflow-y-auto p-0">
            {filteredCatalog.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-[var(--ink-700)]">
                No hay metas que coincidan con los filtros actuales.
              </div>
            ) : (
              filteredCatalog.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`grid w-full grid-cols-[120px_136px_minmax(0,1fr)] gap-4 border-b border-[rgba(15,76,129,0.08)] px-5 py-4 text-left transition ${
                      isSelected
                        ? 'border-l-4 border-l-[var(--coral-500)] bg-[rgba(15,76,129,0.06)] pl-4'
                        : 'hover:bg-[rgba(15,76,129,0.03)]'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--navy-600)]">{stageLabel(item.etapa)}</p>
                      <p className="mt-1 text-xs text-[var(--ink-700)]">{item.id}</p>
                    </div>
                    <p className="text-sm font-medium text-[var(--ink-900)] break-words">{item.dimension || 'Sin dimensión'}</p>
                    <div>
                      <p
                        className="overflow-hidden text-sm font-medium leading-6 text-[var(--ink-900)]"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {item.metabase || 'Sin meta base'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-[rgba(15,76,129,0.08)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--navy-600)]">
                          {item.niveldificultad || 'media'}
                        </span>
                        <p className="text-xs text-[var(--ink-700)]">{item.horizontesugerido || 'Sin horizonte'}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="flex self-start border-[rgba(15,76,129,0.12)] shadow-sm xl:h-[calc(100vh-17rem)]">
          <CardContent className="flex-1 overflow-y-auto p-5">
            {selectedItem ? (
              <>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--navy-600)]">{selectedItem.id}</p>
                    <h3 className="mt-2 text-xl font-bold text-[var(--ink-900)]">Detalle de la meta</h3>
                    <p className="mt-1 text-sm text-[var(--ink-700)]">
                      Revisa aquí la formulación completa y haz ajustes ligeros sin perder la visión de conjunto del catálogo.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setPendingDelete(selectedItem.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Etapa">
                    <Select options={STAGES} value={selectedItem.etapa} onChange={(e) => updateItem(selectedItem.id, 'etapa', e.target.value)} />
                  </Field>
                  <Field label="Tema operativo">
                    <Select options={TOPICS} value={selectedItem.temaoperativo} onChange={(e) => updateItem(selectedItem.id, 'temaoperativo', e.target.value)} />
                  </Field>
                  <Field label="Dimensión">
                    <Select options={DIMENSIONS} value={selectedItem.dimension} onChange={(e) => updateItem(selectedItem.id, 'dimension', e.target.value)} />
                  </Field>
                  <Field label="Nivel de dificultad">
                    <Select options={DIFFICULTY} value={selectedItem.niveldificultad} onChange={(e) => updateItem(selectedItem.id, 'niveldificultad', e.target.value)} />
                  </Field>
                  <Field label="Horizonte sugerido">
                    <TextInput value={selectedItem.horizontesugerido} onChange={(e) => updateItem(selectedItem.id, 'horizontesugerido', e.target.value)} />
                  </Field>
                  <Field label="Frecuencia de seguimiento">
                    <Select options={FOLLOW_UP} value={selectedItem.frecuenciaseguimiento} onChange={(e) => updateItem(selectedItem.id, 'frecuenciaseguimiento', e.target.value)} />
                  </Field>
                </div>

                <div className="mt-4 space-y-4">
                  <Field label="Meta base" hint="Debe ser punto de partida editable, no meta final cerrada.">
                    <TextArea rows={4} value={selectedItem.metabase} onChange={(e) => updateItem(selectedItem.id, 'metabase', e.target.value)} />
                  </Field>
                  <Field label="Pasos base" hint="Escribe pasos sugeridos separados por punto y coma.">
                    <TextArea rows={4} value={selectedItem.pasosbase} onChange={(e) => updateItem(selectedItem.id, 'pasosbase', e.target.value)} />
                  </Field>
                  <Field label="Indicador de logro">
                    <TextArea rows={3} value={selectedItem.indicadorlogro} onChange={(e) => updateItem(selectedItem.id, 'indicadorlogro', e.target.value)} />
                  </Field>
                  <Field label="Cuándo usarla">
                    <TextArea rows={3} value={selectedItem.cuandousarla} onChange={(e) => updateItem(selectedItem.id, 'cuandousarla', e.target.value)} />
                  </Field>
                  <Field label="Conexión con diagnóstico" hint="Usa tags separados por coma para conectar esta meta con hallazgos de Navi.">
                    <TextInput value={selectedItem.conexiondiagnostico} onChange={(e) => updateItem(selectedItem.id, 'conexiondiagnostico', e.target.value)} />
                  </Field>
                  <Field label="Preguntas para afinar" hint="Escribe 2 o 3 preguntas separadas por punto y coma.">
                    <TextArea rows={4} value={selectedItem.preguntasparaafinar} onChange={(e) => updateItem(selectedItem.id, 'preguntasparaafinar', e.target.value)} />
                  </Field>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Button onClick={handleSaveSelected} isLoading={isSaving}>
                    <Save className="mr-2 h-4 w-4" /> Guardar esta meta
                  </Button>
                  <Button variant="outline" onClick={handleSaveAll} isLoading={isSaving}>
                    Guardar catálogo completo
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center text-center text-sm text-[var(--ink-700)]">
                Selecciona una meta del catálogo para revisar su detalle.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
