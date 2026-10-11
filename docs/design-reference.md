# Design reference

Simamia uses the original visual system from [Kiranism/next-shadcn-dashboard-starter](https://github.com/Kiranism/next-shadcn-dashboard-starter), verified against upstream `main` at commit `7705dfc0d13889e45c26a55ad5908da6a7a9a605` on 11 October 2026.

The application shell and page components retain the starter's shadcn/Base UI sidebar, header controls, cards, tables, badges, buttons, dialogs, spacing, typography and Tailwind tokens. The active palette is the repository's Supabase theme (`src/styles/themes/supabase.css`); alternative theme switching is intentionally not exposed so the Supabase appearance remains consistent. Product labels, sample business data and workflows are Simamia-specific and default to simple Kiswahili with an English toggle.

Authentication and unrelated template demonstration routes are omitted from the public static preview. The separate Go API and management/provider documentation are retained in the project; this static browser demo does not connect to that API or to live providers.
