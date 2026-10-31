/**
 * A mosaic of blue squares, generated from a fixed formula (no randomness), so server and client
 * render the same picture. It is decoration only.
 */
const COLS = 56;
const ROWS = 30;

const hash = (x: number, y: number) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000 / 1000;

export function PixelField({ className }: { className?: string }) {
  const cells = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const wave = 0.5 + 0.24 * Math.sin(x * 0.28 + y * 0.18) + 0.2 * Math.sin(x * 0.11 - y * 0.37 + 1.3) + 0.1 * Math.sin(x * 0.8 + y * 0.6);
      const v = Math.min(1, Math.max(0, wave + (hash(x, y) - 0.5) * 0.16));
      const hue = 216 + v * 16;
      const light = 44 + v * 36 + (y / ROWS) * 6;
      cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={`hsl(${hue.toFixed(0)} 92% ${light.toFixed(0)}%)`} />);
    }
  }
  return (
    <svg aria-hidden viewBox={`0 0 ${COLS} ${ROWS}`} preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" className={className}>
      {cells}
    </svg>
  );
}
