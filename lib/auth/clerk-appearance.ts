import { dark } from "@clerk/themes";
import type { SignIn } from "@clerk/nextjs";
import type { ComponentProps } from "react";

type ClerkAppearance = NonNullable<ComponentProps<typeof SignIn>["appearance"]>;

/**
 * Clerk prebuilt components — dark base from `@clerk/themes` + emerald
 * accent per context/ui-context.md. Uses `!` modifiers to win specificity
 * against Clerk's injected inline styles.
 */
export const clerkAppearance: ClerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#34d399",
    colorDanger: "#fb7185",
    colorText: "#fafafa",
    colorTextSecondary: "#a1a1aa",
    colorBackground: "#09090b",
    colorNeutral: "#a1a1aa",
    colorInputBackground: "rgba(0, 0, 0, 0.45)",
    colorInputText: "#fafafa",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-sans)",
    fontSize: "0.9375rem",
  },
  elements: {
    rootBox: "w-full",
    // Glass panel + optional terminal scanline texture (second layer via ::before on .cl-card)
    cardBox:
      "w-full overflow-hidden rounded-xl border-2 border-white/70 ring-1 ring-white/20 bg-zinc-950/35 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-2xl backdrop-saturate-150",
    card:
      "relative isolate overflow-hidden bg-transparent px-4 py-5 shadow-none sm:px-6 sm:py-6 gap-6 before:pointer-events-none before:absolute before:inset-0 before:z-0 before:rounded-[inherit] before:bg-[repeating-linear-gradient(180deg,transparent_0px,transparent_3px,rgba(255,255,255,0.035)_3px,rgba(255,255,255,0.035)_4px)] before:opacity-[0.2]",

    headerTitle:
      "!text-zinc-50 font-heading text-2xl !leading-tight tracking-tight sm:text-3xl sm:tracking-tighter drop-shadow-sm",
    headerSubtitle: "!text-zinc-500 text-sm leading-relaxed",

    socialButtonsBlockButton:
      "relative z-[1] rounded-lg border border-zinc-600/45 bg-zinc-950/30 !text-zinc-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md transition-all hover:border-emerald-400/40 hover:bg-emerald-500/10",
    socialButtonsBlockButtonText: "!text-zinc-200 text-sm font-medium",

    dividerLine: "bg-gradient-to-r from-transparent via-zinc-500/35 to-transparent",
    dividerText: "!text-zinc-500 text-xs uppercase tracking-widest",

    formFieldLabel: "!text-zinc-400 text-sm font-medium",
    formFieldInput:
      "relative z-[1] rounded-lg border border-white/[0.08] !bg-zinc-950/40 !text-zinc-100 placeholder:!text-zinc-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md transition-colors focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/25",
    formFieldHintText: "!text-zinc-500",

    formFieldErrorText:
      "!text-rose-200 text-sm font-medium leading-snug",
    formFieldError:
      "rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5",

    formButtonPrimary:
      "relative z-[1] rounded-lg bg-emerald-400 font-semibold !text-zinc-950 shadow-lg shadow-emerald-500/35 ring-1 ring-emerald-300/30 transition-all hover:bg-emerald-300 hover:shadow-emerald-400/45 hover:ring-emerald-200/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 active:scale-[0.98]",

    footerActionText: "!text-zinc-500",
    footerActionLink:
      "!text-emerald-200 !font-semibold hover:!text-emerald-100 hover:underline underline-offset-2 transition-colors",
    footer:
      "relative z-[1] rounded-b-xl border-t border-white/[0.06] bg-zinc-950/25 backdrop-blur-md",

    identityPreviewText: "!text-zinc-300",
    identityPreviewEditButton:
      "!text-emerald-200 hover:!text-emerald-100 transition-colors",
    formFieldAction:
      "!text-emerald-200 hover:!text-emerald-100 text-sm font-medium transition-colors",

    otpCodeFieldInput:
      "relative z-[1] !border-white/[0.08] !bg-zinc-950/40 !text-zinc-100 backdrop-blur-md",
    formResendCodeLink:
      "!text-emerald-200 hover:!text-emerald-100 transition-colors",

    alert: "rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-left",
    alertText: "!text-rose-100 text-sm leading-relaxed",
    alertIcon: "text-rose-300",

    badge: "bg-emerald-500/20 !text-emerald-300 border border-emerald-400/35",

    // UserButton popover (signed-in menu) — opaque panel + light text on dark UI
    userButtonPopoverCard:
      "rounded-xl border border-zinc-700/60 bg-zinc-950 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/10 backdrop-blur-md",
    userButtonPopoverMain: "bg-zinc-950",
    userButtonPopoverActions: "border-t border-zinc-800/80 bg-zinc-950",
    userButtonPopoverActionButton:
      "!text-zinc-200 hover:!bg-zinc-800/80 hover:!text-zinc-50 transition-colors",
    userButtonPopoverActionButtonIcon: "!text-zinc-400",
    userButtonPopoverFooter: "border-t border-zinc-800/80 bg-zinc-950",
    userPreview: "bg-zinc-950",
    userPreviewMainIdentifier: "!text-zinc-50 font-medium",
    userPreviewSecondaryIdentifier: "!text-zinc-400 text-sm",
    userButtonPopoverAccountName: "!text-zinc-50 font-medium",
    userButtonPopoverAccountIdentifier: "!text-zinc-400 text-sm",
  },
};
