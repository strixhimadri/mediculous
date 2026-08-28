export function AuroraField() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white" aria-hidden>
      <div
        className="absolute inset-0 opacity-100"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 10% 10%, rgba(0, 0, 0, 0.03), transparent 55%),
            radial-gradient(ellipse 70% 55% at 90% 15%, rgba(0, 0, 0, 0.025), transparent 50%),
            radial-gradient(ellipse 65% 50% at 50% 90%, rgba(0, 0, 0, 0.02), transparent 55%),
            linear-gradient(180deg, #ffffff 0%, #fafafa 45%, #ffffff 100%)
          `,
        }}
      />
      <div className="aurora-orb aurora-orb-a absolute -top-24 -left-24 size-[min(42vw,520px)] rounded-full bg-black/4 blur-3xl" />
      <div className="aurora-orb aurora-orb-b absolute top-[12%] -right-20 size-[min(48vw,580px)] rounded-full bg-black/3 blur-3xl" />
      <div className="aurora-orb aurora-orb-a absolute -bottom-32 left-[20%] size-[min(36vw,440px)] rounded-full bg-black/4 blur-3xl" />
    </div>
  )
}
