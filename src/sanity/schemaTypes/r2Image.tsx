import { defineField, defineType } from "sanity";
import { isSpreadImage } from "@/domain/page";
import { r2PublicUrl } from "@/lib/r2";

/** A pointer to a page image in R2 (Sanity meters bandwidth, R2 egress is free).
    `key` is written by the server on upload; editors never type it. */
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
      name: "layout",
      title: "Layout",
      description:
        "Auto reads the scan itself: an image wider than it is tall is a two-page spread. Override only when a scan lies, e.g. a single page that happens to have been scanned in landscape.",
      type: "string",
      initialValue: "auto",
      options: {
        list: [
          { title: "Auto (from the image)", value: "auto" },
          { title: "Single page", value: "single" },
          { title: "Two-page spread", value: "spread" },
        ],
        layout: "radio",
      },
      // Deliberately not required: every page uploaded before this field existed
      // has no value, and a required field would invalidate every published issue.
    }),
    defineField({
      name: "originalFilename",
      title: "Filename",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
    }),
  ],
  preview: {
    select: {
      key: "key",
      filename: "originalFilename",
      alt: "alt",
      layout: "layout",
      width: "width",
      height: "height",
    },
    // The subtitle says which pages the reader thinks this image holds, so a
    // misread scan is visible in the list without opening the row.
    prepare({ key, filename, alt, layout, width, height }) {
      const kind = isSpreadImage(layout, width, height)
        ? "two-page spread"
        : "single page";

      return {
        title: filename || key || "page",
        subtitle: [kind, alt].filter(Boolean).join(" · "),
        media: key
          ? // eslint-disable-next-line @next/next/no-img-element
            <img src={r2PublicUrl(key)} alt="" />
          : undefined,
      };
    },
  },
});
