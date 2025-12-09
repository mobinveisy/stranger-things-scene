export default function AuthorCredit() {
  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono">
      <div
        className="px-4 py-2 border border-primary rounded-md text-xs tracking-widest transition-all duration-300 hover:shadow-lg"
        style={{
          background: "rgba(10, 10, 27, 0.8)",
          boxShadow: "0 0 20px rgba(255, 51, 51, 0.5), inset 0 0 10px rgba(255, 51, 51, 0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <p className="text-muted-foreground">
          Created by{" "}
          <span className="text-primary font-bold" style={{ textShadow: "0 0 10px rgba(255, 51, 51, 0.8)" }}>
            Mobin Veisy
          </span>
        </p>
        <p
          className="text-[10px] text-secondary mt-1 text-center"
          style={{ textShadow: "0 0 8px rgba(30, 144, 255, 0.6)" }}
        >
          Stranger Things 3D
        </p>
      </div>
    </div>
  )
}
