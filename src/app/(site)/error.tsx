"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <div className="px-4 py-16 text-center">
        <p className="font-serif italic text-ink-soft">kaut kas nogāja greizi.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 cursor-pointer font-mono text-[0.75rem] font-bold lowercase tracking-[0.12em] text-orange underline underline-offset-4"
        >
          mēģināt vēlreiz
        </button>
      </div>
    </main>
  );
}
