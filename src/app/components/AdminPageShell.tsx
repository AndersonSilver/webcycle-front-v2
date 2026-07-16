import { ReactNode } from "react";

type AdminPageShellProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  /** Extra classes on the body padding wrapper */
  bodyClassName?: string;
  /** When true, removes max height constraints for tall layouts (e.g. support) */
  flushBody?: boolean;
};

/**
 * Shared admin surface matching the Cursos catalog panel:
 * atmosphere, header band, optional toolbar, body.
 */
export function AdminPageShell({
  eyebrow,
  title,
  description,
  actions,
  toolbar,
  children,
  bodyClassName = "",
  flushBody = false,
}: AdminPageShellProps) {
  return (
    <section className="w-full max-w-none py-0">
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-[#0a1020] shadow-2xl shadow-black/40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 10% -10%, rgba(59,130,246,0.18), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 0%, rgba(14,165,233,0.08), transparent 45%), linear-gradient(180deg, #121a2b 0%, #0a1020 38%, #080d18 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(180deg, black 0%, transparent 70%)",
          }}
        />

        <div className="relative">
          <div className="flex flex-col gap-5 border-b border-white/10 px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-8">
            <div className="min-w-0 max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-blue-300/80 mb-2">
                {eyebrow}
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                {title}
              </h2>
              {description ? (
                <p className="mt-2 text-sm sm:text-[15px] text-gray-400 leading-relaxed">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex flex-col sm:items-end gap-3 shrink-0 w-full sm:w-auto">
                {actions}
              </div>
            ) : null}
          </div>

          {toolbar ? (
            <div className="border-b border-white/10 bg-black/20 px-5 py-4 sm:px-8">
              {toolbar}
            </div>
          ) : null}

          <div
            className={
              flushBody
                ? bodyClassName
                : `px-5 py-6 sm:px-8 sm:py-8 ${bodyClassName}`.trim()
            }
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Inner panel used for cards/tables inside AdminPageShell */
export const adminSurfaceCard =
  "rounded-xl border border-white/10 bg-[#0d1422]/70 overflow-hidden";

export const adminSurfaceCardHover =
  "rounded-xl border border-white/10 bg-[#0d1422]/70 overflow-hidden transition-all duration-300 hover:border-blue-400/30 hover:bg-[#111a2e]/90 hover:shadow-xl hover:shadow-blue-950/30";

export const adminFieldClass =
  "bg-[#0b1220]/80 border-white/10 text-white placeholder-gray-500 focus-visible:ring-blue-500/40";

export const adminSelectClass =
  "h-10 px-3 rounded-lg border border-white/10 bg-[#0b1220]/80 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40";

export const adminOutlineBtn =
  "border-white/15 bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white";
