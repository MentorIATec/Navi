export function getCommunityTheme(community, color, savedSlogan) {
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

