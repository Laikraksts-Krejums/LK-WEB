import { defineField, defineType } from "sanity";
import { isSpreadImage } from "@/domain/page";
import { r2PublicUrl } from "@/lib/r2";

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
      // Not required: pages uploaded before this field existed have no value.
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
