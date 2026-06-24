/**
 * Full-bleed branded loader shown from the moment a qualified device commits to
 * the 3D path until the scene is fully ready (chunk + textures loaded). Holding
 * one calm screen here is what stops the jarring "2D grid → blank → images pop
 * in" sequence on slower mobile networks.
 */
export function ShowroomLoading({ hidden = false }: { hidden?: boolean }) {
  return (
    <div
      className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#efe8dd] transition-opacity duration-700 ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <span className="font-serif text-2xl md:text-3xl font-light text-foreground/80">
        Dori Jaipur
      </span>
      <span className="font-sans text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
        Entering the showroom…
      </span>
      <span className="mt-1 block h-px w-16 overflow-hidden bg-border">
        <span className="block h-full w-1/3 animate-[slide_1.1s_ease-in-out_infinite] bg-foreground/50" />
      </span>
      <style>{`@keyframes slide{0%{transform:translateX(-120%)}100%{transform:translateX(360%)}}`}</style>
    </div>
  )
}
