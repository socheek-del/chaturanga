// @vitest-environment happy-dom
// @vitest-environment-options {"settings":{"disableJavaScriptFileLoading":true,"handleDisabledFileLoadingAsSuccess":true}}
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { FEEDBACK_HUB, FEEDBACK_STRING_KEYS, FeedbackLink, feedbackHub } from './Feedback';

beforeAll(async () => {
  const resources: Record<string, string> = { 'feedback.link': 'Send feedback' };
  for (const key of FEEDBACK_STRING_KEYS) resources[`feedback.${key}`] = `T:${key}`;
  await i18n
    .use(initReactI18next)
    .init({ lng: 'en', resources: { en: { translation: resources } }, keySeparator: false });
});

afterEach(() => {
  cleanup();
  delete window.Feedback;
  document.getElementById('feedback-hub-widget')?.remove();
  localStorage.clear();
});

describe('feedbackHub (fb-001)', () => {
  it('uses the production hub on real hosts', () => {
    expect(feedbackHub('th-chess.beanroti.com', null)).toBe(FEEDBACK_HUB);
  });

  it('stays off on localhost unless a dev hub is set', () => {
    expect(feedbackHub('localhost', null)).toBeNull();
    expect(feedbackHub('127.0.0.1', 'javascript:alert(1)')).toBeNull();
    expect(feedbackHub('localhost', 'http://localhost:8787/')).toBe('http://localhost:8787');
  });
});

describe('FeedbackLink (fb-001)', () => {
  it('loads the widget once and shows the link only after it is ready', () => {
    localStorage.setItem('feedback-hub:dev', 'http://localhost:8787');
    const { queryByTestId, rerender } = render(<FeedbackLink product="makruk" />);
    expect(queryByTestId('feedback-link')).toBeNull();
    const script = document.getElementById('feedback-hub-widget') as HTMLScriptElement;
    expect(script.src).toBe('http://localhost:8787/widget.js');
    expect(script.dataset).toMatchObject({ project: 'chaturanga', launcher: 'none', publicIssues: 'true' });

    rerender(<FeedbackLink product="makruk" />);
    expect(document.querySelectorAll('#feedback-hub-widget')).toHaveLength(1);

    const widget = { open: vi.fn(), setContext: vi.fn(), setStrings: vi.fn() };
    act(() => {
      window.Feedback = widget;
      window.dispatchEvent(new Event('feedback-hub:ready'));
    });
    const link = queryByTestId('feedback-link')!;
    expect(link.textContent).toBe('Send feedback');
    expect(widget.setStrings).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'T:title', continue: 'T:continue' }),
    );
    const provider = widget.setContext.mock.calls[0]![0] as () => Record<string, unknown>;
    expect(provider()).toEqual({ product: 'makruk', language: 'en' });

    fireEvent.click(link);
    expect(widget.open).toHaveBeenCalledOnce();
  });

  it('renders nothing and loads nothing on localhost by default', () => {
    const { container } = render(<FeedbackLink product="makruk" />);
    expect(container.innerHTML).toBe('');
    expect(document.getElementById('feedback-hub-widget')).toBeNull();
  });
});
