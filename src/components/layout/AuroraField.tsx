export function AuroraField() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white" aria-hidden>
      <div
        className="absolute inset-0 opacity-100"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 8% 12%, rgba(107, 155, 192, 0.07), transparent 58%),
            radial-gradient(ellipse 65% 50% at 92% 18%, rgba(255, 153, 204, 0.06), transparent 55%),
            radial-gradient(ellipse 60% 45% at 50% 95%, rgba(0, 163, 255, 0.04), transparent 60%),
            linear-gradient(180deg, #ffffff 0%, #fafafa 48%, #ffffff 100%)
          `,
        }}
      />
      <div className="aurora-orb aurora-orb-a absolute -top-24 -left-24 size-[min(42vw,520px)] rounded-full bg-[#6b9bc0]/8 blur-3xl" />
      <div className="aurora-orb aurora-orb-b absolute top-[12%] -right-20 size-[min(48vw,580px)] rounded-full bg-[#ffb3d9]/6 blur-3xl" />
      <div className="aurora-orb aurora-orb-a absolute -bottom-32 left-[20%] size-[min(36vw,440px)] rounded-full bg-[#00a3ff]/5 blur-3xl" />
    </div>
  )
}
