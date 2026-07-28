/**
 * Sezione richiudibile del pannello impostazioni.
 *
 * Con l'aumentare delle voci il pannello era diventato un lungo scorrimento:
 * raccogliendole in `<details>` a fisarmonica se ne vede una per volta.
 * `<details>` nativo significa zero stato React e apertura da tastiera.
 *
 * Vive qui e non dentro DashboardHeader perché la usa anche MediaSettings.
 */

import { ChevronDown } from 'lucide-react';

interface SettingsSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Aperta al primo sguardo: solo per la sezione più usata. */
  defaultOpen?: boolean;
  /** Pastiglia accanto al titolo, per uno stato che va visto anche da chiusa. */
  badge?: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsSection({
  title,
  icon: Icon,
  defaultOpen = false,
  badge,
  children,
}: SettingsSectionProps) {
  return (
    <details open={defaultOpen} className="settings-acc border-t border-bento-border pt-3">
      <summary className="flex cursor-pointer select-none items-center justify-between gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 transition-colors duration-200 hover:text-slate-200">
        <span className="flex min-w-0 items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-theme-500" />
          <span className="truncate">{title}</span>
          {badge}
        </span>
        <ChevronDown className="acc-chevron h-3.5 w-3.5 shrink-0 text-slate-600 transition-transform duration-200" />
      </summary>
      <div className="space-y-3 pt-3">{children}</div>
    </details>
  );
}
