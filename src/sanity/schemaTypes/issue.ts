import { defineArrayMember, defineField, defineType } from "sanity";
import { R2PagesInput } from "../components/R2PagesInput";
import { HotspotsInput } from "../components/HotspotsInput";

export const issue = defineType({
  name: "issue",
  title: "Issue",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "pages", title: "Pages" },
    { name: "links", title: "Page links" },
  ],
  fields: [
    defineField({
      name: "number",
      title: "Issue number",
      description: "The highest number is treated as the latest issue.",
      type: "number",
      group: "content",
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: "title",
      title: "Theme",
      description: 'For example: "Nenoliec karoti".',
      type: "string",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "URL slug",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Published",
      type: "datetime",
      group: "content",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "blurb",
      title: "Short description",
      type: "text",
      rows: 3,
      group: "content",
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      description:
        "Shown on the issue archive page, and as the homepage poster when this is the newest issue. Leave empty and the homepage renders with no poster: this is how you take the poster down.",
      type: "image",
      group: "content",
      options: { hotspot: true },
    }),

    defineField({
      name: "pages",
      title: "Pages",
      description:
        "Drag the page images here. The order in this list is the order in the magazine: drag rows to reorder.",
      type: "array",
      group: "pages",
      of: [defineArrayMember({ type: "r2Image" })],
      components: { input: R2PagesInput },
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "pdf",
      title: "PDF",
      type: "file",
      group: "pages",
      options: { accept: "application/pdf" },
    }),

    defineField({
      name: "hotspots",
      title: "Page links",
      description:
        "Invisible clickable areas over printed text, e.g. the Instagram handle and email on the back cover.",
      type: "array",
      group: "links",
      of: [defineArrayMember({ type: "hotspot" })],
      components: { input: HotspotsInput },
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "numberDesc",
      by: [{ field: "number", direction: "desc" }],
    },
  ],
  preview: {
    select: { number: "number", title: "title", media: "coverImage" },
    prepare({ number, title, media }) {
      return { title: `${number}. ${title}`, media };
    },
  },
});
