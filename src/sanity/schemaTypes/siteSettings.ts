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
      type: "text",
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "instagramUrl",
      title: "Instagram",
      type: "url",
    }),
    defineField({
      name: "facebookUrl",
      title: "Facebook",
      type: "url",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
    }),
    defineField({
      name: "metaDescription",
      title: "Search engine description",
      type: "text",
      rows: 2,
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
      description: "1200×630.",
      type: "image",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site settings" }),
  },
});
