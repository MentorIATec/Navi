import { forwardRef } from 'react';
import { CalendarDays, Check, CheckCheck } from 'lucide-react';
import { communityInk } from '../utils/communityInk';
import './GoalKeepsake.css';

export const GoalKeepsake = forwardRef(function GoalKeepsake({ name, community, sessionLabel, primary, complementary, horizon, strategy }, ref) {
  const extended = String(primary).length > 180 || [primary, complementary, strategy].join('').length > 420;
  return (
    <article ref={ref} className={`goal-keepsake${extended ? ' goal-keepsake--extended' : ''}`} style={{ '--community-color': community.accent, '--community-ink': communityInk(community.accent) }}>
      <header className="keepsake-community">
        <div><p>COMUNIDAD {community.label}</p><p className="keepsake-slogan">{community.slogan}</p></div>
        <span className="keepsake-wordmark">faro</span>
      </header>
      <div className="keepsake-body">
        <p className="keepsake-label keepsake-session">Mi sesión de mentoría · {sessionLabel}</p>
        <div className="keepsake-identity">
          <h3>{name}</h3>
          <div className="keepsake-seal" aria-hidden="true"><span><Check size={26} strokeWidth={1.8} /></span></div>
        </div>
        <section className="keepsake-primary"><p className="keepsake-label">Me comprometí a</p><p className="keepsake-goal">{primary}</p></section>
        <section className="keepsake-complement"><p className="keepsake-label">Meta complementaria</p><p className="keepsake-copy">{complementary}</p></section>
        <div className="keepsake-horizon"><CalendarDays size={24} aria-hidden="true" /><p><span>Por los próximos</span><strong>{horizon}</strong></p></div>
      </div>
      <section className="keepsake-strategy"><p className="keepsake-label">Cuando se complique</p><p className="keepsake-copy">{strategy}</p></section>
      <footer className="keepsake-closure"><CheckCheck size={24} aria-hidden="true" /><span>Mentoría completada</span></footer>
    </article>
  );
});
