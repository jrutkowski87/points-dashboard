import { CARD_MAP } from '../data/cards.js';
import { PROGRAM_MAP } from '../data/programs.js';

// Short brand marks per card
const CARD_MARKS = {
  amexPlatBiz:          'AMEX',
  deltaReserveBusiness: 'Δ BIZ',
  deltaReservePersonal: 'Δ PERS',
  chaseSapphireReserve: 'CSR',
  biltPalladium:        'BILT',
};

/**
 * CardLogo — inline pill badge with brand color + abbreviation
 * size: 'xs' | 'sm' (default) | 'md'
 */
export function CardLogo({ cardId, size = 'sm' }) {
  const card = CARD_MAP[cardId];
  if (!card) return null;
  const mark = CARD_MARKS[cardId] || card.shortName.slice(0, 4).toUpperCase();
  const fontSize = size === 'xs' ? '0.52rem' : size === 'md' ? '0.68rem' : '0.58rem';
  const padding = size === 'xs' ? '1px 5px' : size === 'md' ? '3px 8px' : '2px 6px';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding,
      background: `${card.color}18`,
      border: `1px solid ${card.color}35`,
      borderRadius: 4,
      color: card.color,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize,
      fontWeight: 800,
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
      lineHeight: 1.5,
      flexShrink: 0,
    }}>
      {mark}
    </span>
  );
}

/**
 * ProgramMark — square monogram badge with logo letter
 * size: 'xs' | 'sm' (default) | 'md' | 'lg'
 */
export function ProgramMark({ programId, size = 'sm' }) {
  const program = PROGRAM_MAP[programId];
  if (!program) return null;
  const dim = { xs: 18, sm: 24, md: 30, lg: 38 }[size] || 24;
  const fs = { xs: '0.55rem', sm: '0.68rem', md: '0.8rem', lg: '1rem' }[size] || '0.68rem';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dim,
      height: dim,
      background: `${program.color}20`,
      border: `1px solid ${program.color}40`,
      borderRadius: 7,
      color: program.color,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: fs,
      fontWeight: 900,
      flexShrink: 0,
      lineHeight: 1,
    }}>
      {program.logo || program.shortName[0]}
    </span>
  );
}

