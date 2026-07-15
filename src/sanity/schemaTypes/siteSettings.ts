import { defineField, defineType } from "sanity";

/** Singleton. Everything here is editable without a deploy. */
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "tagline",
      title: "Tagline",
      description:
        "Shown on the homepage. Also used as the search engine description.",
      type: "text",
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "keywords",
      title: "Keywords",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "ogImage",
      title: "Social sharing image",
      description: "1200x630.",
      type: "image",
    }),
    defineField({
      name: "favicon",
      title: "Favicon",
      description: "Square image, at least 512x512.",
      type: "image",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site settings" }),
  },
});
