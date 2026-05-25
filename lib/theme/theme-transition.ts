export type AppTheme = 'light' | 'dark';

const WIPE_DURATION_MS = 520;
/** Apply theme while wipe is in progress — avoids full-screen solid hold */
const THEME_APPLY_AT = 0.7;
const FADE_OUT_MS = 64;
const WIPE_EASING = 'cubic-bezier(0.32, 0.08, 0.24, 1)';
const FADE_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * Diagonal sweep from top-left. Oversized triangle covers the viewport by end of wipe.
 */
const CLIP_START = 'polygon(0% 0%, 0% 0%, 0% 0%)';
const CLIP_END = 'polygon(0% 0%, 260% 0%, 0% 260%)';

/** Incoming theme fill — matches `.pf-page` gradient base */
const THEME_BG: Record<AppTheme, string> = {
  dark: '#0a0a0a',
  light: '#f7faf8',
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function getAnimationDurationMs(animation: Animation): number {
  const duration = animation.effect?.getComputedTiming().duration;
  return typeof duration === 'number' && Number.isFinite(duration)
    ? duration
    : WIPE_DURATION_MS;
}

function getAnimationCurrentTimeMs(animation: Animation): number {
  const t = animation.currentTime;
  return typeof t === 'number' && Number.isFinite(t) ? t : 0;
}

function runDiagonalWipe(nextTheme: AppTheme, onThemeSwap: () => void): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    let themeSwapped = false;
    let rafId = 0;

    const overlay = document.createElement('div');
    overlay.className = 'theme-transition-overlay';
    overlay.style.backgroundColor = THEME_BG[nextTheme];
    overlay.style.clipPath = CLIP_START;
    overlay.style.opacity = '1';
    document.body.appendChild(overlay);

    void overlay.getBoundingClientRect();

    const swapTheme = () => {
      if (themeSwapped) return;
      themeSwapped = true;
      onThemeSwap();
    };

    const cleanup = async () => {
      if (settled) return;
      settled = true;
      cancelAnimationFrame(rafId);

      swapTheme();
      await waitForPaint();

      try {
        const fade = overlay.animate(
          { opacity: [1, 0] },
          { duration: FADE_OUT_MS, easing: FADE_EASING, fill: 'forwards' },
        );
        await fade.finished;
      } catch {
        // cancelled
      }

      overlay.remove();
      resolve();
    };

    const wipe = overlay.animate(
      { clipPath: [CLIP_START, CLIP_END] },
      { duration: WIPE_DURATION_MS, easing: WIPE_EASING, fill: 'forwards' },
    );

    const trackProgress = () => {
      const duration = getAnimationDurationMs(wipe);
      if (!themeSwapped && getAnimationCurrentTimeMs(wipe) >= duration * THEME_APPLY_AT) {
        swapTheme();
      }
      if (wipe.playState === 'running') {
        rafId = requestAnimationFrame(trackProgress);
      }
    };

    rafId = requestAnimationFrame(trackProgress);

    wipe.onfinish = () => {
      void cleanup();
    };
    wipe.oncancel = () => {
      void cleanup();
    };
  });
}

let transitionLock = false;

/**
 * Toggle theme with a top-left → bottom-right diagonal wipe.
 * Theme swaps at ~70% of the wipe so content repaints before full cover.
 */
export async function toggleThemeWithTransition(
  resolvedTheme: string | undefined,
  setTheme: (theme: AppTheme) => void,
): Promise<void> {
  if (transitionLock) return;

  const nextTheme: AppTheme = resolvedTheme === 'dark' ? 'light' : 'dark';

  if (prefersReducedMotion()) {
    setTheme(nextTheme);
    return;
  }

  transitionLock = true;
  document.documentElement.setAttribute('data-theme-transitioning', '');

  try {
    await runDiagonalWipe(nextTheme, () => setTheme(nextTheme));
  } finally {
    transitionLock = false;
    document.documentElement.removeAttribute('data-theme-transitioning');
  }
}
