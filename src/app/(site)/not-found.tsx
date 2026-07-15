import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <main>
      <EmptyState>
        šī lapa neeksistē. — <Link href="/">uz sākumu</Link>
      </EmptyState>
    </main>
  );
}
