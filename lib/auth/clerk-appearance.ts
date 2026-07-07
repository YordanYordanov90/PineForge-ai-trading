import { dark } from '@clerk/themes';
import type { SignIn } from '@clerk/nextjs';
import type { ComponentProps } from 'react';

type ClerkAppearance = NonNullable<ComponentProps<typeof SignIn>['appearance']>;

const clerkElementsDark: ClerkAppearance['elements'] = {
  rootBox: 'w-full',
  cardBox:
    'w-full overflow-hidden rounded-xl border-2 border-white/70 ring-1 ring-white/20 bg-zinc-950/35 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl backdrop-saturate-150',
  card:
    'relative isolate overflow-hidden bg-transparent px-4 py-5 shadow-none sm:px-6 sm:py-6 gap-6 before:pointer-events-none before:absolute before:inset-0 before:z-0 before:rounded-[inherit] before:bg-[repeating-linear-gradient(180deg,transparent_0px,transparent_3px,rgba(255,255,255,0.035)_3px,rgba(255,255,255,0.035)_4px)] before:opacity-[0.2]',
  headerTitle:
    '!text-zinc-50 font-heading text-2xl !leading-tight tracking-tight sm:text-3xl sm:tracking-tighter drop-shadow-sm',
  headerSubtitle: '!text-zinc-500 text-sm leading-relaxed',
  socialButtonsBlockButton:
    'relative z-[1] rounded-lg border border-zinc-600/45 bg-zinc-950/30 !text-zinc-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md transition-all hover:border-neon-400/40 hover:bg-neon-500/10',
  socialButtonsBlockButtonText: '!text-zinc-200 text-sm font-medium',
  dividerLine: 'bg-gradient-to-r from-transparent via-zinc-500/35 to-transparent',
  dividerText: '!text-zinc-500 text-xs uppercase tracking-widest',
  formFieldLabel: '!text-zinc-400 text-sm font-medium',
  formFieldInput:
    'relative z-[1] rounded-lg border border-white/[0.08] !bg-zinc-950/40 !text-zinc-100 placeholder:!text-zinc-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md transition-colors focus:border-neon-400/60 focus:ring-2 focus:ring-neon-400/25',
  formFieldHintText: '!text-zinc-500',
  formFieldErrorText: '!text-rose-200 text-sm font-medium leading-snug',
  formFieldError: 'rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5',
  formButtonPrimary:
    'relative z-[1] rounded-lg bg-neon-400 font-semibold !text-zinc-950 shadow-lg shadow-neon-500/35 ring-1 ring-neon-300/30 transition-all hover:bg-neon-300 hover:shadow-neon-400/45 hover:ring-neon-200/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-400/50 active:scale-[0.98]',
  footerActionText: '!text-zinc-500',
  footerActionLink:
    '!text-neon-200 !font-semibold hover:!text-neon-100 hover:underline underline-offset-2 transition-colors',
  footer:
    'relative z-[1] rounded-b-xl border-t border-white/[0.06] bg-zinc-950/25 backdrop-blur-md',
  identityPreviewText: '!text-zinc-300',
  identityPreviewEditButton: '!text-neon-200 hover:!text-neon-100 transition-colors',
  formFieldAction: '!text-neon-200 hover:!text-neon-100 text-sm font-medium transition-colors',
  otpCodeFieldInput:
    'relative z-[1] !border-white/[0.08] !bg-zinc-950/40 !text-zinc-100 backdrop-blur-md',
  formResendCodeLink: '!text-neon-200 hover:!text-neon-100 transition-colors',
  alert: 'rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-left',
  alertText: '!text-rose-100 text-sm leading-relaxed',
  alertIcon: 'text-rose-300',
  badge: 'bg-neon-500/20 !text-neon-300 border border-neon-400/35',
  userButtonPopoverCard:
    'rounded-xl border border-zinc-700/60 bg-zinc-950 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/10 backdrop-blur-md',
  userButtonPopoverMain: 'bg-zinc-950',
  userButtonPopoverActions: 'border-t border-zinc-800/80 bg-zinc-950',
  userButtonPopoverActionButton:
    '!text-zinc-200 hover:!bg-zinc-800/80 hover:!text-zinc-50 transition-colors',
  userButtonPopoverActionButtonIcon: '!text-zinc-400',
  userButtonPopoverFooter: 'border-t border-zinc-800/80 bg-zinc-950',
  userPreview: 'bg-zinc-950',
  userPreviewMainIdentifier: '!text-zinc-50 font-medium',
  userPreviewSecondaryIdentifier: '!text-zinc-400 text-sm',
  userButtonPopoverAccountName: '!text-zinc-50 font-medium',
  userButtonPopoverAccountIdentifier: '!text-zinc-400 text-sm',
  // Checkout drawer (Clerk Billing). Needs an explicit opaque background —
  // the shared `card` override above is transparent by design (it sits
  // inside `cardBox`), but the drawer renders in a portal with no such shell.
  drawerBackdrop: 'bg-zinc-950/70 backdrop-blur-sm',
  drawerContent: '!bg-zinc-950 border-l border-zinc-800 shadow-2xl',
  drawerRoot: 'z-[100]',
  drawerHeader: '!bg-zinc-950 border-b border-zinc-800/80',
  drawerTitle: '!text-zinc-50 font-heading font-semibold',
  drawerBody: '!bg-zinc-950',
  drawerFooter: '!bg-zinc-950 border-t border-zinc-800/80',
  checkoutFormLineItemsRoot: '!bg-zinc-950',
  checkoutFormElementsRoot: '!bg-zinc-950',
};

const clerkElementsLight: ClerkAppearance['elements'] = {
  ...clerkElementsDark,
  cardBox:
    'w-full overflow-hidden rounded-xl border border-zinc-200/90 bg-white/80 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] backdrop-blur-2xl backdrop-saturate-150',
  card: 'relative isolate overflow-hidden bg-transparent px-4 py-5 shadow-none sm:px-6 sm:py-6 gap-6',
  headerTitle:
    '!text-zinc-900 font-heading text-2xl !leading-tight tracking-tight sm:text-3xl sm:tracking-tighter',
  headerSubtitle: '!text-zinc-500 text-sm leading-relaxed',
  socialButtonsBlockButton:
    'relative z-[1] rounded-lg border border-zinc-300/80 bg-white !text-zinc-800 transition-all hover:border-neon-500/50 hover:bg-neon-50',
  socialButtonsBlockButtonText: '!text-zinc-800 text-sm font-medium',
  dividerLine: 'bg-gradient-to-r from-transparent via-zinc-300/60 to-transparent',
  dividerText: '!text-zinc-500 text-xs uppercase tracking-widest',
  formFieldLabel: '!text-zinc-600 text-sm font-medium',
  formFieldInput:
    'relative z-[1] rounded-lg border border-zinc-300/80 !bg-white !text-zinc-900 placeholder:!text-zinc-400 transition-colors focus:border-neon-500/60 focus:ring-2 focus:ring-neon-500/20',
  formFieldHintText: '!text-zinc-500',
  formButtonPrimary:
    'relative z-[1] rounded-lg bg-neon-500 font-semibold !text-white shadow-md shadow-neon-500/25 transition-all hover:bg-neon-600 focus-visible:ring-2 focus-visible:ring-neon-500/40 active:scale-[0.98]',
  footerActionText: '!text-zinc-500',
  footerActionLink:
    '!text-neon-700 !font-semibold hover:!text-neon-800 hover:underline underline-offset-2 transition-colors',
  footer: 'relative z-[1] rounded-b-xl border-t border-zinc-200/80 bg-zinc-50/80 backdrop-blur-md',
  identityPreviewText: '!text-zinc-700',
  identityPreviewEditButton: '!text-neon-700 hover:!text-neon-800 transition-colors',
  formFieldAction: '!text-neon-700 hover:!text-neon-800 text-sm font-medium transition-colors',
  otpCodeFieldInput: 'relative z-[1] !border-zinc-300/80 !bg-white !text-zinc-900',
  formResendCodeLink: '!text-neon-700 hover:!text-neon-800 transition-colors',
  userButtonPopoverCard:
    'rounded-xl border border-zinc-200/90 bg-white shadow-lg ring-1 ring-zinc-200/50 backdrop-blur-md',
  userButtonPopoverMain: 'bg-white',
  userButtonPopoverActions: 'border-t border-zinc-200/80 bg-white',
  userButtonPopoverActionButton:
    '!text-zinc-700 hover:!bg-zinc-100 hover:!text-zinc-900 transition-colors',
  userButtonPopoverActionButtonIcon: '!text-zinc-500',
  userButtonPopoverFooter: 'border-t border-zinc-200/80 bg-white',
  userPreview: 'bg-white',
  userPreviewMainIdentifier: '!text-zinc-900 font-medium',
  userPreviewSecondaryIdentifier: '!text-zinc-500 text-sm',
  userButtonPopoverAccountName: '!text-zinc-900 font-medium',
  userButtonPopoverAccountIdentifier: '!text-zinc-500 text-sm',
  drawerBackdrop: 'bg-zinc-900/40 backdrop-blur-sm',
  drawerContent: '!bg-white border-l border-zinc-200 shadow-2xl',
  drawerRoot: 'z-[100]',
  drawerHeader: '!bg-white border-b border-zinc-200/80',
  drawerTitle: '!text-zinc-900 font-heading font-semibold',
  drawerBody: '!bg-white',
  drawerFooter: '!bg-white border-t border-zinc-200/80',
  checkoutFormLineItemsRoot: '!bg-white',
  checkoutFormElementsRoot: '!bg-white',
};

/** Dark terminal shell — default PineForge auth UI. */
export const clerkAppearanceDark: ClerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#34d399',
    colorDanger: '#fb7185',
    colorText: '#fafafa',
    colorTextSecondary: '#a1a1aa',
    colorBackground: '#09090b',
    colorNeutral: '#a1a1aa',
    colorInputBackground: 'rgba(0, 0, 0, 0.45)',
    colorInputText: '#fafafa',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9375rem',
  },
  elements: clerkElementsDark,
};

/** Light shell — neon accent, zinc text. */
export const clerkAppearanceLight: ClerkAppearance = {
  variables: {
    colorPrimary: '#10b981',
    colorDanger: '#e11d48',
    colorText: '#18181b',
    colorTextSecondary: '#71717a',
    colorBackground: '#fafafa',
    colorNeutral: '#71717a',
    colorInputBackground: '#ffffff',
    colorInputText: '#18181b',
    borderRadius: '0.75rem',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9375rem',
  },
  elements: clerkElementsLight,
};

/** @deprecated Use `clerkAppearanceDark` or `useClerkAppearance()`. */
export const clerkAppearance = clerkAppearanceDark;
