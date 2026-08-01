/**
 * Shared styling for every Clerk UI component in the app. Import this
 * into any <SignIn>, <SignUp>, or <UserButton> etc. via the
 * `appearance` prop so they all stay visually consistent with the
 * rest of the Bureau, without needing to restyle each one separately.
 */
export const clerkAppearance = {
    variables: {
      colorPrimary: "#B01E28", // brass token — actually blood red, see globals.css
      colorBackground: "#14171C", // charcoal
      colorInputBackground: "#0B0D10", // ink
      colorInputText: "#EDE7DA", // parchment
      colorText: "#EDE7DA",
      colorTextSecondary: "#8A8F98", // fog
      colorDanger: "#A6392F", // rust
      fontFamily: "var(--font-plex-sans)",
      borderRadius: "0.25rem",
    },
    elements: {
      rootBox: "w-full",
      card: "bg-charcoal border border-white/10 shadow-none rounded-lg",
      headerTitle: "font-display uppercase text-2xl tracking-wide text-parchment",
      headerSubtitle: "text-fog text-sm",
      socialButtonsBlockButton:
        "bg-ink border border-white/10 text-parchment hover:bg-white/5 rounded",
      socialButtonsBlockButtonText: "font-medium text-sm",
      dividerLine: "bg-white/10",
      dividerText: "text-fog text-xs tracking-widest uppercase",
      formFieldLabel: "text-fog text-xs tracking-wide uppercase",
      formFieldInput:
        "bg-ink border border-white/10 text-parchment rounded font-mono text-sm focus:border-brass/50",
      formButtonPrimary:
        "bg-brass hover:bg-brass-dim text-parchment font-medium tracking-wide rounded normal-case",
      footerActionText: "text-fog text-sm",
      footerActionLink: "text-brass hover:text-brass-dim font-medium",
      identityPreviewText: "text-parchment",
      identityPreviewEditButtonIcon: "text-brass",
      formResendCodeLink: "text-brass hover:text-brass-dim",
      otpCodeFieldInput: "bg-ink border border-white/10 text-parchment font-mono",
      formFieldInputShowPasswordButton: "text-fog hover:text-parchment",
      footer: "bg-transparent",
    },
  };