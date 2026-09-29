import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * fb-001: in-app feedback through feedback-hub (https://feedback.beanroti.com). The hub's widget files
 * each report as an issue in this repo. Every product shares one hub project; the report's context names
 * the product. The widget's own floating button stays hidden — this link opens it instead.
 */
export const FEEDBACK_HUB = 'https://feedback.beanroti.com';
export const FEEDBACK_PROJECT = 'chaturanga';
const SCRIPT_ID = 'feedback-hub-widget';
/** On localhost, set this localStorage key to a hub address (e.g. http://localhost:8787) to try the widget. */
export const FEEDBACK_DEV_HUB_KEY = 'feedback-hub:dev';

/** Widget strings the product translates, as `feedback.<key>` (listed in KEYS.md). */
export const FEEDBACK_STRING_KEYS = [
  'title',
  'close',
  'type',
  'bug',
  'idea',
  'details',
  'placeholder',
  'note',
  'publicNote',
  'owner',
  'send',
  'sending',
  'sent',
  'failed',
  'rateLimited',
  'network',
  'queued',
  'challengeFailed',
  'continue',
  'handoff',
  'handedOff',
  'closeTab',
] as const;

interface FeedbackWidget {
  open(kind?: 'bug' | 'idea'): void;
  setContext(provider: () => Record<string, unknown>): void;
  setStrings(strings: Record<string, string>): void;
}

declare global {
  interface Window {
    Feedback?: FeedbackWidget;
  }
}

/** The hub to load from, or null to skip: local dev and tests stay offline unless opted in. */
export function feedbackHub(hostname: string, devHub: string | null): string | null {
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') return FEEDBACK_HUB;
  return devHub && /^https?:\/\//.test(devHub) ? devHub.replace(/\/$/, '') : null;
}

function readDevHub(): string | null {
  try {
    return localStorage.getItem(FEEDBACK_DEV_HUB_KEY);
  } catch {
    return null;
  }
}

export interface FeedbackLinkProps {
  /** The product id, sent with every report so agents know which game it is about. */
  product: string;
}

/** A "Send feedback" link for the page footer. Renders nothing until the widget has loaded. */
export function FeedbackLink({ product }: FeedbackLinkProps) {
  const { t, i18n } = useTranslation();
  const [ready, setReady] = useState(false);
  const language = useRef(i18n.language);
  language.current = i18n.language;

  useEffect(() => {
    const hub = feedbackHub(location.hostname, readDevHub());
    if (!hub) return;
    const onReady = () => setReady(true);
    window.addEventListener('feedback-hub:ready', onReady);
    if (window.Feedback) setReady(true);
    else if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = `${hub}/widget.js`;
      script.defer = true;
      script.dataset.project = FEEDBACK_PROJECT;
      script.dataset.launcher = 'none';
      script.dataset.publicIssues = 'true';
      document.body.appendChild(script);
    }
    return () => window.removeEventListener('feedback-hub:ready', onReady);
  }, []);

  useEffect(() => {
    if (ready) window.Feedback?.setContext(() => ({ product, language: language.current }));
  }, [ready, product]);

  useEffect(() => {
    if (!ready) return;
    const strings: Record<string, string> = {};
    for (const key of FEEDBACK_STRING_KEYS) strings[key] = t(`feedback.${key}`);
    window.Feedback?.setStrings(strings);
  }, [ready, t, i18n.language]);

  if (!ready) return null;
  return (
    <p className="mt-3 text-center text-sm text-muted">
      <button
        type="button"
        data-testid="feedback-link"
        onClick={() => window.Feedback?.open()}
        className="rounded font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
      >
        {t('feedback.link')}
      </button>
    </p>
  );
}
