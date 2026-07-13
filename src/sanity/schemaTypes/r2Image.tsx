import { defineField, defineType } from "sanity";
import { r2PublicUrl } from "@/lib/r2";

/**
 * A pointer to a page image in R2 — Sanity meters bandwidth, R2 egress is free.
 * `key` is written by the server on upload; editors never type it.
 */
export const r2Image = defineType({
  name: "r2Image",
  title: "Page",
  type: "object",
  fields: [
    defineField({
      name: "key",
      title: "R2 key",
      type: "string",
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "width",
      title: "Width",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "height",
      title: "Height",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "originalFilename",
      title: "Filename",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "size",
      title: "Size (bytes)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
    }),
  ],
  preview: {
    select: { key: "key", filename: "originalFilename", alt: "alt" },
    prepare({ key, filename, alt }) {
      return {
        title: filename || key || "page",
        subtitle: alt,
        media: key
          ? // eslint-disable-next-line @next/next/no-img-element
            <img src={r2PublicUrl(key)} alt="" />
          : undefined,
      };
    },
  },
});
