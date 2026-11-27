import { useMemo } from 'react';

// Common HSK 1 characters that drift down behind the hero, faint like ink on paper.
const CHARACTERS = '你好我是学中文爱说听读写书人大小日月水火山天心口家朋友谢再见吃喝看来去';

// Three depths: far characters are small, blurred, faint and slow; near ones are larger,
// sharp and a little quicker. Most sit far away, so the effect stays quiet.
const LAYERS = [
  { count: 16, size: [12, 16], blur: 1.6, opacity: [0.04, 0.06], duration: [30, 40], red: 0 },
  { count: 12, size: [18, 24], blur: 0.6, opacity: [0.06, 0.08], duration: [22, 30], red: 0 },
  { count: 8, size: [28, 38], blur: 0, opacity: [0.07, 0.1], duration: [16, 22], red: 0.25 },
];

// A fixed seed keeps the pattern the same on every render and every visit.
function seeded(seed) {
  let value = seed;
  return () => { value = (value * 16807) % 2147483647; return (value - 1) / 2147483646; };
}

export default function CharacterRain() {
  const drops = useMemo(() => {
    const random = seeded(42);
    const between = ([low, high]) => low + random() * (high - low);
    let index = 0;
    return LAYERS.flatMap(layer => Array.from({ length: layer.count }, () => {
      const duration = between(layer.duration);
      return {
        // Every character appears in turn, so no single one repeats too often.
        char: CHARACTERS[index++ % CHARACTERS.length],
        left: random() * 98,
        size: Math.round(between(layer.size)),
        blur: layer.blur,
        duration,
        delay: -random() * duration,
        opacity: between(layer.opacity),
        red: random() < layer.red,
      };
    }));
  }, []);

  return <div className="character-rain" aria-hidden="true">
    {drops.map((drop, index) => <span
      key={index}
      lang="zh-CN"
      className={drop.red ? 'is-red' : undefined}
      style={{ left: `${drop.left}%`, fontSize: drop.size, filter: drop.blur ? `blur(${drop.blur}px)` : undefined, animationDuration: `${drop.duration}s`, animationDelay: `${drop.delay}s`, '--rain-opacity': drop.opacity }}
    >{drop.char}</span>)}
  </div>;
}
