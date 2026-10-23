import { ImageResponse } from "next/og";
import { getIssueBySlug, getLatestIssue, REVALIDATE_SECONDS } from "@/server/issues";

const WIDTH = 1200;
const HEIGHT = 630;
const COVER_HEIGHT = 570;

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("issue");
  const issue = slug ? await getIssueBySlug(slug) : await getLatestIssue();

  if (!issue?.coverUrl) {
    return Response.redirect(new URL("/og-image.jpg", request.url), 307);
  }

  // Satori needs an absolute src; dev fixtures use relative paths.
  const cover = new URL(issue.coverUrl, request.url).toString();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f2e8d9",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> only */}
        <img
          src={cover}
          alt=""
          height={COVER_HEIGHT}
          style={{ height: COVER_HEIGHT, boxShadow: "0 12px 40px rgba(48, 48, 46, 0.25)" }}
        />
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "Cache-Control": `public, max-age=${REVALIDATE_SECONDS}, s-maxage=${REVALIDATE_SECONDS}`,
      },
    },
  );
}
