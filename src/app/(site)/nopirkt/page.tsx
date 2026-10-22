import type { Metadata } from "next";
import { CopyCodeword } from "@/components/CopyCodeword";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getSiteSettings } from "@/server/issues";

// Must be a literal — Next reads segment config statically. Mirrors REVALIDATE_SECONDS.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "gribi nopirkt krējumu? — krējums.",
  description:
    "Gribi krējumu? Raksti instagramā vai zvani un saki kodvārdu.",
  alternates: { canonical: "/nopirkt" },
};

const VALUE =
  "font-serif text-[clamp(1.3rem,3.5vw,1.7rem)] text-ink no-underline transition-colors duration-[140ms] hover:text-orange motion-reduce:transition-none";
const NOTE = "mt-1 font-serif text-[0.95rem] leading-snug text-ink-soft";

export default async function BuyPage() {
  const { buy } = await getSiteSettings();

  return (
    <main className="mx-auto mb-12 max-w-[30rem] text-center">
      <h1 className="mt-[clamp(1rem,2vw,1.5rem)] font-serif text-[clamp(0.85rem,1.4vw,0.98rem)] font-normal italic leading-normal text-ink-soft">
        gribi nopirkt krējumu?
      </h1>

      <ol className="mt-[clamp(1.5rem,4vw,2.5rem)] flex list-none flex-col items-center gap-[clamp(1.75rem,4.5vw,2.5rem)] p-0">
        <li>
          <Eyebrow className="block text-orange">1. raksti vai zvani</Eyebrow>
          <p className={NOTE}>instagramā</p>
          <a
            href={`https://ig.me/m/${buy.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className={VALUE}
          >
            @{buy.instagram}
          </a>
          <p className={`${NOTE} mt-3`}>vai pa telefonu</p>
          <a
            href={`tel:${buy.phone.replace(/[^\d+]/g, "")}`}
            className={`${VALUE} tabular-nums`}
          >
            {buy.phone}
          </a>
        </li>

        <li>
          <Eyebrow className="block text-orange">2. saki kodvārdu</Eyebrow>
          <CopyCodeword codeword={buy.codeword} />
        </li>
      </ol>
    </main>
  );
}
