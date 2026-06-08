export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[var(--accent-blue)] opacity-[0.04] blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[var(--accent-violet)] opacity-[0.04] blur-3xl" />
        <div
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
          className="absolute inset-0"
        />
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
