import type { StructureResolver } from "sanity/structure";

/** Site Settings and Social links are singletons, not lists you can create more of. */
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
      S.listItem()
        .title("Social links")
        .id("socialLinks")
        .child(
          S.document().schemaType("socialLinks").documentId("socialLinks"),
        ),
    ]);
