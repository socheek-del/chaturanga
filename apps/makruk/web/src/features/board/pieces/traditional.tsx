import type { Piece } from '@chaturanga/makruk';
import { useId } from 'react';
import biaBlack from './traditional/bia-black.svg?raw';
import biaWhite from './traditional/bia-white.svg?raw';
import biangaiBlack from './traditional/biangai-black.svg?raw';
import biangaiWhite from './traditional/biangai-white.svg?raw';
import khonBlack from './traditional/khon-black.svg?raw';
import khonWhite from './traditional/khon-white.svg?raw';
import khunBlack from './traditional/khun-black.svg?raw';
import khunWhite from './traditional/khun-white.svg?raw';
import maBlack from './traditional/ma-black.svg?raw';
import maWhite from './traditional/ma-white.svg?raw';
import metBlack from './traditional/met-black.svg?raw';
import metWhite from './traditional/met-white.svg?raw';
import rueaBlack from './traditional/ruea-black.svg?raw';
import rueaWhite from './traditional/ruea-white.svg?raw';

/**
 * art-003: "traditional wood" piece set — the traditional Makruk piece art itself, not a redrawing of it.
 *
 * The SVGs in ./traditional/ are Yevrowl's Makruk pieces from Wikimedia Commons (CC BY-SA 4.0), stored
 * verbatim; see ./traditional/CREDITS.md. Each piece comes as two files: a filled silhouette ("black") and
 * the carved line art ("white"). A piece is the two of them stacked — the silhouette in the side's body
 * colour, the line art on top in the side's line colour — which is how the set reads on a real board: bone
 * pieces with dark cuts against near-black pieces with pale cuts. The art is never edited; only the colours
 * are supplied at render time, so the set survives the dark board themes.
 */
export const TRADITIONAL_PALETTE = {
  w: { body: '#f5e7c6', line: '#000000' },
  b: { body: '#000000', line: '#f0d7a6' },
} as const;

type Palette = (typeof TRADITIONAL_PALETTE)[keyof typeof TRADITIONAL_PALETTE];

/** The two files that make up each piece: [silhouette, line art]. */
const ART: Record<'k' | 'm' | 's' | 'n' | 'r' | 'p' | 'p~', readonly [string, string]> = {
  k: [khunBlack, khunWhite],
  m: [metBlack, metWhite],
  s: [khonBlack, khonWhite],
  n: [maBlack, maWhite],
  r: [rueaBlack, rueaWhite],
  p: [biaBlack, biaWhite],
  // Bia Ngai: the promoted Bia has its own drawing in the set.
  'p~': [biangaiBlack, biangaiWhite],
};

interface Layer {
  viewBox: string;
  /** The file's own markup, with its hard-coded colours removed so the side's colour can be applied. */
  body: string;
}

const LAYERS = new Map<string, Layer>();

function layer(file: string): Layer {
  const cached = LAYERS.get(file);
  if (cached) return cached;
  const parsed: Layer = {
    viewBox: file.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 360 360',
    body: file
      .replace(/<\?xml[^>]*\?>/g, '')
      .replace(/<!DOCTYPE[\s\S]*?>/g, '')
      .replace(/^[\s\S]*?<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
      .replace(/\s(?:fill|stroke)="[^"]*"/g, ''),
  };
  LAYERS.set(file, parsed);
  return parsed;
}

function Art({ file, colour, stroke }: { file: string; colour: string; stroke: string }) {
  const { viewBox, body } = layer(file);
  return (
    // A nested <svg> keeps each file in its own coordinate system, so the drawings stay untouched.
    <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
      <g fill={colour} stroke={stroke}>
        {/* The markup is the committed art file, with its colours stripped. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the art is a committed static asset. */}
        <g dangerouslySetInnerHTML={{ __html: body }} />
      </g>
    </svg>
  );
}

export function TraditionalPiece({ piece, className }: { piece: Piece; className?: string }) {
  const palette: Palette = TRADITIONAL_PALETTE[piece.color];
  // React ids contain ':' — invalid in a CSS url() reference, so strip it for the mask id.
  const id = `mk-trad-${useId().replaceAll(':', '')}`;
  const key = piece.promoted ? 'p~' : piece.type;
  const [silhouette, lines] = ART[key];
  // On the dark side the cuts are pale, so they are masked to the body: a pale line must not halo the
  // silhouette the way it would on the light side, where the same art is the piece's own outline.
  const masked = piece.color === 'b';

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false" data-set="traditional" data-type={key}>
      {masked && (
        // Chromium ignores `mask` on a nested <svg>, so the mask goes on a wrapping <g>.
        <mask id={`${id}-body`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <Art file={silhouette} colour="#fff" stroke="#fff" />
        </mask>
      )}
      <Art file={silhouette} colour={palette.body} stroke={palette.body} />
      {masked ? (
        <g mask={`url(#${id}-body)`}>
          <Art file={lines} colour={palette.line} stroke="none" />
        </g>
      ) : (
        <Art file={lines} colour={palette.line} stroke="none" />
      )}
    </svg>
  );
}
