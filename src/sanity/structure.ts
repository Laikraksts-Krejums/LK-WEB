import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("krējums")
    .items([
      S.listItem()
        .title("Issues")
        .child(S.documentTypeList("issue").title("Issues")),
      S.listItem()
        .title("Links")
        .child(S.documentTypeList("siteLink").title("Links")),
      S.divider(),
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings"),
        ),
    ]);
