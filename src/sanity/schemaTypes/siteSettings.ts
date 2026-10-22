import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Browser title",
      description:
        "Shown in the browser tab and as the search engine result heading.",
      type: "string",
      validation: (rule) => rule.required(),
    }),
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
    defineField({
      name: "buy",
      title: "“Gribu nopirkt krējumu” button",
      description:
        "Shown on the /nopirkt page, linked from the header. To link a magazine page there, point a hotspot at /nopirkt.",
      type: "object",
      options: { collapsible: true },
      fields: [
        defineField({
          name: "instagram",
          title: "Instagram username",
          description: "Without the @.",
          type: "string",
          initialValue: "laikrakstskrejums",
        }),
        defineField({
          name: "phone",
          title: "Phone number",
          type: "string",
          initialValue: "+371 20 246 668",
        }),
        defineField({
          name: "codeword",
          title: "Codeword",
          type: "string",
          initialValue: "dzīves skrējums",
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site settings" }),
  },
});
