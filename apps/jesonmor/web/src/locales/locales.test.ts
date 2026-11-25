import { describeLocales, flattenKeys } from '@chaturanga/game-shell/testing';
import { describe, expect, it } from 'vitest';
import { PRODUCT } from '../../product.config';
import en from './en.json';

const sources = import.meta.glob(['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describeLocales(PRODUCT, { en }, sources);

const onlineKeys = [
  'modes.online',
  'computer.sideWhite',
  'computer.sideBlack',
  'computer.sideRandom',
  'computer.you',
  'online.opponent',
  'online.quickTitle',
  'online.quickHint',
  'online.searching',
  'online.createTitle',
  'online.color',
  'online.create',
  'online.joinTitle',
  'online.codeLabel',
  'online.join',
  'online.invalidCode',
  'online.notFound',
  'online.serverError',
  'online.connecting',
  'online.reconnecting',
  'online.waitingTitle',
  'online.shareHint',
  'online.copyLink',
  'online.copied',
  'online.qrAlt',
  'online.waitingFor',
  'online.spectating',
  'online.offerDraw',
  'online.drawOffered',
  'online.drawOfferReceived',
  'online.accept',
  'online.decline',
  'online.opponentDisconnected',
  'online.rematchOffered',
  'online.rematchReceived',
  'play.cancel',
  'play.timeControl',
  'play.noClock',
  'play.custom',
  'play.minutes',
  'play.increment',
  'play.categories.bullet',
  'play.categories.blitz',
  'play.categories.rapid',
  'play.categories.classical',
];

describe('Jeson Mor shared online screen locale', () => {
  it('defines every string used by the shared lobby and room', () => {
    const defined = new Set(flattenKeys(en));
    expect(onlineKeys.filter((key) => !defined.has(key))).toEqual([]);
  });
});
