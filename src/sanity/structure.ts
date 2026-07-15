import type { StructureResolver } from "sanity/structure";

/** Site Settings is a singleton, not a list you can create more of. Links is
 *  an ordinary list: create as many reusable links as you need. */
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
