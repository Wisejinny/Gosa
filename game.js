// 고사성어 그랑프리 - 학생 앱과 교사 대시보드가 함께 쓰는 게임 규칙
const SET_SIZE = 15;
const PASS = 70;
const DATA = IDIOMS.map((a, i) => ({ id: i, w: a[0], h: a[1], c: a[2].split('/'), l: a[3], m: a[4], e: a[5], hard: i >= 150 }));
const COURSES = [];
for (let i = 0; i < DATA.length; i += SET_SIZE) COURSES.push(DATA.slice(i, i + SET_SIZE));

const ZONES = [
  { name: '서킷 리그', sub: '중학 필수 고사성어 150', icon: '🏁' },
  { name: '하드 코스 · 산악 랠리', sub: '고등 필수 고사성어 150', icon: '⛰️' }
];

// 존마다: 코스1~5 → 중간 점검 → 코스6~10 → 중간 점검 → 레벨업 테스트(전체 10코스)
const NODES = [];
ZONES.forEach((z, zi) => {
  const b = zi * 10;
  const course = c => NODES.push({ id: 'c' + c, type: 'course', zone: zi, course: c, label: `코스 ${c + 1}`, short: `코스 ${c + 1}` });
  const check = (from, to) => NODES.push({ id: `cp${from}`, type: 'cp', zone: zi, from, to, label: `중간 점검 (코스 ${from + 1}~${to + 1})`, short: '🚩 중간 점검' });
  for (let c = b; c < b + 5; c++) course(c);
  check(b, b + 4);
  for (let c = b + 5; c < b + 10; c++) course(c);
  check(b + 5, b + 9);
  NODES.push({ id: `fin${zi}`, type: 'final', zone: zi, from: b, to: b + 9,
    label: zi === 0 ? '레벨업 테스트 (코스 1~10)' : '마스터 테스트 (코스 11~20)', short: zi === 0 ? '🏁 레벨업 테스트' : '👑 마스터 테스트' });
});
const NODES_PER_ZONE = NODES.length / ZONES.length; // 13
const NODE_IDX = Object.fromEntries(NODES.map((n, i) => [n.id, i]));

const QUIZ_PLAN = { course: [6, 4, 3, 2], cp: [8, 6, 4, 2], final: [10, 8, 5, 2] };
const STAGES = [
  { w: 1, name: '뜻 맞추기' }, { w: 1.5, name: '초성 힌트 쓰기' },
  { w: 2, name: '힌트 없이 쓰기' }, { w: 2.5, name: '문장 만들기' }
];
const MEDALS = [
  { name: '도전 중', icon: '🔁', color: '#ffffff' },
  { name: '동메달', icon: '🥉', color: '#d08a4c' },
  { name: '은메달', icon: '🥈', color: '#b8c2d0' },
  { name: '금메달', icon: '🥇', color: '#f5b400' },
  { name: '트로피', icon: '🏆', color: '#8b5cf6' }
];
const TIERS = [
  { name: '루키 레이서', reward: '기본 카트 · 헬멧' },
  { name: '주니어 레이서', reward: '고글 · 빨간 머플러' },
  { name: '프로 레이서', reward: '레이싱 스트라이프 · 체크 깃발' },
  { name: '산악 레이서', reward: '오프로드 바퀴 · 하드 코스 입장권' },
  { name: '에이스 레이서', reward: '스포일러 날개 · 망토' },
  { name: '챔피언', reward: '은빛 카트 · 불꽃 부스터' },
  { name: '고사성어 마스터', reward: '황금 카트 · 왕관 · 트로피' }
];

function nodePool(n) { return n.type === 'course' ? COURSES[n.course] : COURSES.slice(n.from, n.to + 1).flat(); }
function medalOf(score) { return score >= 100 ? 4 : score >= 90 ? 3 : score >= 80 ? 2 : score >= PASS ? 1 : 0; }
function isCleared(u, n) { const r = (u.sets || {})[n.id]; return !!(r && r.stamp > 0); }
function progressOf(u) { let i = 0; while (i < NODES.length && isCleared(u, NODES[i])) i++; return i; }
function tierOf(u) { return NODES.slice(0, progressOf(u)).filter(n => n.type !== 'course').length; }
function medalCounts(u) { const m = [0, 0, 0, 0, 0]; Object.values(u.sets || {}).forEach(s => { if (s.stamp) m[s.stamp]++; }); return m; }
function locationOf(p) { return p >= NODES.length ? '🏆 완주' : NODES[p].short; }
function pubOf(u) {
  const m = medalCounts(u), p = progressOf(u), t = tierOf(u);
  return { p, t, tn: TIERS[t].name, loc: locationOf(p), m: [m[1], m[2], m[3], m[4]], k: Object.keys(u.known || {}).length };
}

// ===== 레벨별 카트 캐릭터 (뒤에서 본 모습, 오리지널 일러스트) =====
const KART_COLOR = ['#ffd23f', '#ffd23f', '#ff4d5e', '#2f7cff', '#2fc37a', '#d5dce8', '#f5b400'];
const HELMET = ['#ffffff', '#ffffff', '#ffffff', '#ff7a3d', '#8b5cf6', '#1d2a44', '#fff3c4'];
function racerSVG(t, w, x, y) {
  const c = KART_COLOR[t], hc = HELMET[t], ink = '#1d2a44';
  const pos = x !== undefined ? `x="${x}" y="${y}"` : '';
  const big = t >= 3;
  let s = `<svg ${pos} width="${w}" height="${w * 0.9}" viewBox="-6 -10 132 118" aria-hidden="true">`;
  s += `<ellipse cx="60" cy="96" rx="52" ry="6" fill="rgba(0,0,0,.22)"/>`;
  if (t >= 5) s += `<path d="M42 80 Q38 96 46 106 Q48 94 52 86 Z M68 80 Q72 96 64 106 Q62 94 58 86 Z" fill="#ff7a3d"/><path d="M45 82 Q44 92 47 99 Q49 90 51 84 Z M65 82 Q66 92 63 99 Q61 90 59 84 Z" fill="#ffd23f"/>`;
  if (t >= 4) s += `<path d="M46 32 Q20 36 2 60 Q30 54 60 56 Q90 54 118 60 Q100 36 74 32 Z" fill="#8b5cf6" stroke="${ink}" stroke-width="2.5"/>`;
  s += big
    ? `<rect x="4" y="54" width="32" height="38" rx="9" fill="${ink}"/><rect x="84" y="54" width="32" height="38" rx="9" fill="${ink}"/>
       <path d="M8 62h24M8 70h24M8 78h24M8 86h24M88 62h24M88 70h24M88 78h24M88 86h24" stroke="#4a5876" stroke-width="3"/>`
    : `<rect x="12" y="60" width="22" height="28" rx="6" fill="${ink}"/><rect x="86" y="60" width="22" height="28" rx="6" fill="${ink}"/>`;
  s += `<path d="M18 66 Q20 48 40 46 L80 46 Q100 48 102 66 L104 78 Q60 86 16 78 Z" fill="${c}" stroke="${ink}" stroke-width="3"/>`;
  if (t === 6) s += `<path d="M30 52 Q60 44 90 52" stroke="#fff6c9" stroke-width="4" fill="none" opacity=".8"/>`;
  if (t >= 2) s += `<rect x="47" y="47" width="6" height="35" fill="#fff" opacity=".9"/><rect x="67" y="47" width="6" height="35" fill="#fff" opacity=".9"/>`;
  s += `<rect x="44" y="68" width="32" height="9" rx="3" fill="${ink}"/><rect x="24" y="68" width="12" height="6" rx="2" fill="#ff4d5e"/><rect x="84" y="68" width="12" height="6" rx="2" fill="#ff4d5e"/>`;
  if (t >= 2) s += `<text x="60" y="76" text-anchor="middle" font-family="Jua,sans-serif" font-size="9" fill="#ffd23f">GP</text>`;
  if (t >= 4) s += `<rect x="34" y="40" width="4" height="10" fill="${ink}"/><rect x="82" y="40" width="4" height="10" fill="${ink}"/><rect x="20" y="33" width="80" height="9" rx="3" fill="${ink}"/><rect x="24" y="35" width="72" height="3" fill="${c}"/>`;
  if (t >= 2) s += `<line x1="100" y1="64" x2="106" y2="10" stroke="${ink}" stroke-width="2.5"/>
    <rect x="106" y="10" width="16" height="12" fill="#fff" stroke="${ink}" stroke-width="1.5"/><rect x="106" y="10" width="4" height="4" fill="${ink}"/><rect x="114" y="10" width="4" height="4" fill="${ink}"/><rect x="110" y="14" width="4" height="4" fill="${ink}"/><rect x="118" y="14" width="4" height="4" fill="${ink}"/><rect x="106" y="18" width="4" height="4" fill="${ink}"/><rect x="114" y="18" width="4" height="4" fill="${ink}"/>`;
  if (t >= 1) s += `<path d="M72 46 Q92 38 106 46 Q94 50 76 54 Z" fill="#ff4d5e" stroke="${ink}" stroke-width="2"/><rect x="44" y="44" width="32" height="8" rx="4" fill="#ff4d5e" stroke="${ink}" stroke-width="2"/>`;
  s += `<circle cx="60" cy="28" r="19" fill="${hc}" stroke="${ink}" stroke-width="3"/>`;
  s += `<path d="M44 30 Q60 22 76 30 L76 36 Q60 31 44 36 Z" fill="${c}" opacity=".85"/>`;
  if (t >= 1) s += `<path d="M41 20 Q60 12 79 20" stroke="${ink}" stroke-width="4" fill="none"/><circle cx="52" cy="17" r="6" fill="#9be3ff" stroke="${ink}" stroke-width="2.5"/><circle cx="68" cy="17" r="6" fill="#9be3ff" stroke="${ink}" stroke-width="2.5"/>`;
  if (t >= 6) s += `<path d="M44 12 L47 -6 L54 4 L60 -9 L66 4 L73 -6 L76 12 Z" fill="#ffd23f" stroke="#b37a00" stroke-width="2.5"/><circle cx="60" cy="-2" r="2.5" fill="#ff4d5e"/>`;
  return s + '</svg>';
}
