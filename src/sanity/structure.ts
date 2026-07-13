import type { StructureResolver } from "sanity/structure";

/** Site Settings is a singleton, not a list you can create more of. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("krējums")
    .items([
      S.listItem()
        .title("Issues")
        .child(S.documentTypeList("issue").title("Issues")),
      S.divider(),
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings"),
        ),
    ]);
