import { useRef, useState } from 'react';
import { BookmarkCheck, CalendarDays, Check, Compass, ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';

const LABELS = { ocupacional: 'Ocupacional', intelectual: 'Intelectual', emocional: 'Emocional', social: 'Social', fisica: 'Física', espiritual: 'Espiritual', financiera: 'Financiera' };

export function GoalChoice({ goal, selected, onSelect, disabled }) {
  return (
    <button type="button" className="clarity-explore-choice" aria-pressed={selected} onClick={() => onSelect(goal)} disabled={disabled}>
      <span className="clarity-explore-choice-top"><span>{LABELS[goal.dimension] || 'Meta sugerida'}</span><span className="clarity-explore-check"><Check aria-hidden="true" size={15} /></span></span>
      <span className="clarity-explore-choice-text">{goal.text}</span>
      {goal.horizontesugerido ? <span className="clarity-explore-horizon"><CalendarDays aria-hidden="true" size={17} />{goal.horizontesugerido}</span> : null}
    </button>
  );
}

function SelectionTools({ kind, selected, draft, onDraft, locked }) {
  return <div className="clarity-explore-selection-tools">
    {kind === 'prioritaria' ? <details>
      <summary>¿Así quieres expresar esta meta?</summary>
      <label className="clarity-explore-help" htmlFor="primary-goal-draft">Puedes dejarla tal como está o ajustarla para que se sienta más tuya.</label>
      <textarea id="primary-goal-draft" aria-label="Meta prioritaria" rows={4} value={draft} onChange={event => onDraft(event.target.value)} disabled={locked} />
    </details> : null}
    {selected.pasosbase ? <details>
      <summary>Ver ejemplos de cómo avanzar con esta meta</summary>
      <ol>{selected.pasosbase.split(';').map(item => item.trim()).filter(Boolean).map((item, index) => <li key={index}>{item}</li>)}</ol>
    </details> : null}
  </div>;
}

export function GoalExplorer({ exploration, kind, selected, draft, horizon, onDraft, onSelect, locked }) {
  const [expanded, setExpanded] = useState(false);
  const optionsRef = useRef(null);
  const changePage = async action => {
    await action();
    requestAnimationFrame(() => optionsRef.current?.querySelector('button')?.focus());
  };
  const title = kind === 'prioritaria' ? 'Meta prioritaria' : 'Meta complementaria';
  const selectedText = kind === 'prioritaria' ? draft : selected?.text;
  const selectedHorizon = horizon || selected?.horizontesugerido;
  const canExpand = kind === 'prioritaria' || Boolean(selected?.pasosbase);
  const selectionContent = selected ? <>
    <span className="clarity-explore-selection-title"><span>{title}{exploration.compact && canExpand ? <ChevronDown className="clarity-explore-chevron" aria-hidden="true" size={16} /> : null}</span><span className="clarity-explore-bookmark"><BookmarkCheck aria-hidden="true" size={20} /></span></span>
    <span className="clarity-explore-selection-text">{selectedText}</span>
    {selectedHorizon ? <span className="clarity-explore-horizon"><CalendarDays aria-hidden="true" size={17} />{selectedHorizon}</span> : null}
  </> : null;
  const tools = selected ? <SelectionTools kind={kind} selected={selected} draft={draft} onDraft={onDraft} locked={locked || exploration.busy} /> : null;
  const summary = selected ? <aside className="clarity-explore-selection" aria-label={`${title} seleccionada`}>
    {exploration.compact && canExpand ? <details className="clarity-explore-selection-fold"><summary>{selectionContent}</summary>{tools}</details> : <><div>{selectionContent}</div>{tools}</>}
  </aside> : null;
  return (
    <div className="clarity-explorer" data-kind={kind} aria-busy={exploration.busy}>
      {selected && selected.id !== 'custom-complementaria' ? <span className="sr-only" role="status" aria-live="polite">{title}: {selected.text}</span> : null}
      {summary}
      <section className="clarity-explore-options" aria-label={title}>
        {kind === 'prioritaria' ? <>
          <button type="button" className="clarity-explore-toggle" aria-expanded={expanded} onClick={() => setExpanded(old => !old)} disabled={locked || exploration.busy}><Compass aria-hidden="true" size={19} />Explorar otras metas<ChevronDown aria-hidden="true" size={17} /></button>
          {expanded ? <div className="clarity-explore-topics" role="group" aria-label="Explorar otras metas">{exploration.contexts.map(topic => <button type="button" key={topic.id} aria-pressed={exploration.context === topic.id} disabled={locked || exploration.busy} onClick={() => exploration.activate(topic.id)}>{topic.label}</button>)}</div> : null}
        </> : null}
        {exploration.priorities.length ? <p className="clarity-explore-priorities">Estas metas se ordenaron a partir de tus áreas de oportunidad más sensibles: <strong>{exploration.priorities.map(item => item.label).join(' y ')}</strong>.</p> : null}
        <div ref={optionsRef} className="clarity-explore-grid">{exploration.options.map(goal => <GoalChoice key={goal.id} goal={goal} selected={selected?.id === goal.id} onSelect={onSelect} disabled={locked || exploration.busy} />)}</div>
        {exploration.busy && !exploration.options.length ? <p role="status">Cargando catálogo de metas propuesto...</p> : null}
        {!exploration.options.length && !exploration.error && !exploration.busy ? <p className="clarity-explore-empty">Ya viste las metas más relacionadas con tus áreas prioritarias. Si quieres, también puedes explorar otras metas de contexto similar.</p> : null}
        <div className="clarity-explore-paging">
          {exploration.hasPrevious ? <Button variant="outline" aria-label="Volver a las opciones anteriores" onClick={() => changePage(exploration.previous)} disabled={locked || exploration.busy}><ArrowLeft aria-hidden="true" size={18} /></Button> : null}
          {exploration.hasNext ? <Button variant="outline" onClick={() => changePage(exploration.next)} disabled={locked || exploration.busy}>Mostrar nuevas opciones<ArrowRight aria-hidden="true" size={17} /></Button> : null}
          {exploration.error && exploration.canRetry ? <Button variant="outline" onClick={exploration.retry} disabled={locked || exploration.busy}>Mostrar nuevas opciones</Button> : null}
        </div>
      </section>
    </div>
  );
}
