import { useEffect, useRef } from 'react';

const focusable = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Dialog({ children, onClose, labelledBy, className }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const outside = [];
    for (let branch = dialog; branch.parentElement && branch !== document.body; branch = branch.parentElement) {
      outside.push(...[...branch.parentElement.children].filter(node => node !== branch));
    }
    const priorInert = outside.map(node => node.inert);
    outside.forEach(node => { node.inert = true; });
    const items = () => [...dialog.querySelectorAll(focusable)].filter(node => node.getClientRects().length > 0);
    (items()[0] || dialog).focus();
    const onKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const controls = items();
      const first = controls[0], last = controls.at(-1);
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    dialog.addEventListener('keydown', onKey);
    return () => {
      dialog.removeEventListener('keydown', onKey);
      outside.forEach((node, index) => { node.inert = priorInert[index]; });
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} className={className}>{children}</div>;
}
