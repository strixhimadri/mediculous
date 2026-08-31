export function AuroraField() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 15% 0%, rgba(0, 0, 0, 0.03), transparent 55%),
            radial-gradient(ellipse 70% 50% at 85% 100%, rgba(0, 0, 0, 0.025), transparent 50%),
            linear-gradient(180deg, #ffffff 0%, #fafafa 45%, #ffffff 100%)
          `,
        }}
      />
      <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />
    </div>
  )
}
