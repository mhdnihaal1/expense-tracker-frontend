// Spendwise glyph: wallet with two cards peeking out. viewBox 0 0 600 560.
// mode: 'color' (white wallet + accent cards) | 'mono' (single color with cutouts)
module.exports = function glyph(mode = 'color', fg = '#FFFFFF', { shadow = true, sized = false } = {}) {
  const W = 600, H = 560;
  if (mode === 'mono') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs><mask id="m">
    <rect width="${W}" height="${H}" fill="white"/>
    <polyline points="122,452 188,398 238,424 318,338" fill="none" stroke="black" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="368" y="282" width="232" height="156" rx="56" fill="black"/>
  </mask></defs>
  <g mask="url(#m)">
    <rect x="150" y="20" width="300" height="200" rx="40" transform="rotate(-12 300 120)" fill="${fg}"/>
    <rect x="60" y="170" width="480" height="370" rx="80" fill="${fg}"/>
  </g>
  <rect x="396" y="310" width="176" height="100" rx="40" fill="${fg}"/>
</svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" ${sized ? `width="${W}" height="${H}" ` : ''}viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="dot" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366F1"/><stop offset="1" stop-color="#8B5CF6"/>
    </linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#1E1B4B" flood-opacity="0.28"/>
    </filter>
  </defs>
  <!-- cards peeking out of the wallet -->
  <rect x="120" y="40" width="300" height="190" rx="36" transform="rotate(-14 270 135)" fill="#34D399"/>
  <rect x="210" y="34" width="300" height="190" rx="36" transform="rotate(9 360 129)" fill="#FBBF24"/>
  <!-- wallet body -->
  <rect x="60" y="170" width="480" height="370" rx="80" fill="${fg}"${shadow ? ' filter="url(#sh)"' : ''}/>
  <!-- rising trend line -->
  <polyline points="122,452 188,398 238,424 318,338" fill="none" stroke="url(#dot)" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="318" cy="338" r="22" fill="#34D399" stroke="${fg}" stroke-width="8"/>
  <!-- clasp -->
  <rect x="380" y="294" width="200" height="124" rx="52" fill="#E0E7FF"/>
  <circle cx="448" cy="356" r="26" fill="url(#dot)"/>
</svg>`;
};
