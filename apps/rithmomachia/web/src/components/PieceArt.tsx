import type { Color, Piece } from '@chaturanga/rules-core';
import { PYRAMID_COMPONENTS } from '@chaturanga/rithmomachia';
import { cn } from '@chaturanga/ui';

export interface PieceInfo {
  shape: 'circle' | 'triangle' | 'square' | 'pyramid';
  value: number;
  components: Array<{ shape: 'circle' | 'triangle' | 'square'; value: number }>;
  special?: 'siege';
}

export function pieceInfo(type: string, color: Color): PieceInfo {
  if (type === 'z') return { shape: 'pyramid', value: 0, components: [], special: 'siege' };
  const componentIndex = /^[a-v]$/.test(type) ? type.charCodeAt(0) - 97 : -1;
  if (componentIndex >= 0) {
    const component = PYRAMID_COMPONENTS[componentIndex];
    return component
      ? { shape: component.shape, value: component.value, components: [{ shape: component.shape, value: component.value }] }
      : { shape: 'circle', value: 0, components: [] };
  }
  if (type.startsWith('p')) {
    const mask = Number.parseInt(type.slice(1), 36);
    const components = PYRAMID_COMPONENTS.filter((component) =>
      component.color === color && (mask & (1 << component.index)) !== 0,
    );
    return {
      shape: 'pyramid',
      value: components.reduce((total, component) => total + component.value, 0),
      components: components.map(({ shape, value }) => ({ shape, value })),
    };
  }
  const match = /^([cts])(\d+)$/.exec(type);
  const shape = match?.[1] === 't' ? 'triangle' : match?.[1] === 's' ? 'square' : 'circle';
  const value = Number(match?.[2] ?? 0);
  return { shape, value, components: [{ shape, value }] };
}

function ShapePath({ shape, className }: { shape: PieceInfo['shape']; className?: string }) {
  if (shape === 'circle') return <circle className={className} cx="32" cy="32" r="25" />;
  if (shape === 'triangle') return <path className={className} d="M32 5 59 56H5L32 5Z" />;
  if (shape === 'square') return <path className={className} d="M9 9H55V55H9z" />;
  return (
    <g className={className}>
      <path d="M32 8 55 53H9L32 8Z" />
      <path d="M32 17 47 47H17L32 17Z" />
      <path d="M32 26 39 41H25L32 26Z" />
    </g>
  );
}

/** Original geometric faces: shape and side pattern remain distinguishable without color. */
export function PieceArt({ piece, className = '' }: { piece: Piece; className?: string }) {
  const info = pieceInfo(piece.type, piece.color);
  const digits = `${info.value}`.length;
  const fontSize = digits >= 4 ? 13 : digits === 3 ? 16 : digits === 2 ? 20 : 24;
  const componentMarks = info.shape === 'pyramid' && !info.special ? info.components.slice(0, 3) : [];
  return (
    <span className={cn('rith-token', piece.color === 'w' ? 'rith-token--white' : 'rith-token--black', `rith-token--${info.shape}`, className)} aria-hidden>
      <svg viewBox="0 0 64 64" fill="none" focusable="false">
        <ShapePath shape={info.shape} className="token-edge" />
        <ShapePath shape={info.shape} className="token-face" />
        {piece.color === 'w'
          ? <circle className="token-side-mark" cx="32" cy="13" r="2.3" />
          : <path className="token-side-mark" d="M23 16 41 34M20 28l15 15" />}
        {componentMarks.length > 0 && componentMarks.map((component, index) => (
          <path
            key={`${component.shape}-${component.value}`}
            className="pyramid-stack-mark"
            d={component.shape === 'circle'
              ? `M${19 + index * 9} ${24 + index * 4}a3.2 3.2 0 1 0 .01 0`
              : component.shape === 'triangle'
                ? `M${16 + index * 8} ${24 + index * 4}l6 7h-12z`
                : `M${13 + index * 8} ${23 + index * 4}h7v7h-7z`}
          />
        ))}
        {info.special === 'siege' ? (
          <text className="piece-value" x="32" y="38" textAnchor="middle" fontSize="19">ALL</text>
        ) : (
          <text className="piece-value" x="32" y={info.shape === 'pyramid' ? '44' : '40'} textAnchor="middle" fontSize={fontSize}>{info.value}</text>
        )}
      </svg>
    </span>
  );
}
