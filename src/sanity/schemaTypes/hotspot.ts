import { defineField, defineType } from "sanity";

/**
 * An invisible link over a printed one. Per-issue data, not CSS: issue I's
 * coordinates will be wrong for issue II, and moving a link shouldn't need a
 * deploy. The href for instagram/facebook/email is resolved from Site Settings
 * at render time, not stored here.
 */
export const hotspot = defineType({
  name: "hotspot",
  title: "Page link",
  type: "object",
  fields: [
    defineField({
      name: "pageNumber",
      title: "Page number",
      description: "Which page this link sits on (1 = front cover).",
      type: "number",
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: "target",
      title: "Links to",
      type: "string",
      initialValue: "instagram",
      options: {
        list: [
          { title: "Instagram", value: "instagram" },
          { title: "Facebook", value: "facebook" },
          { title: "Email", value: "email" },
          { title: "Custom URL", value: "custom" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "customHref",
      title: "URL",
      type: "url",
      hidden: ({ parent }) => parent?.target !== "custom",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { target?: string } | undefined;
          if (parent?.target === "custom" && !value) {
            return "Enter a URL";
          }
          return true;
        }),
    }),
    defineField({
      name: "label",
      title: "Label (for screen readers)",
      type: "string",
      validation: (rule) => rule.required(),
    }),

    // Percentages of the page box, so they hold at any render size.
    defineField({
      name: "left",
      title: "From left (%)",
      type: "number",
      validation: (rule) => rule.required().min(0).max(100),
    }),
    defineField({
      name: "right",
      title: "From right (%)",
      type: "number",
      validation: (rule) => rule.required().min(0).max(100),
    }),
    defineField({
      name: "top",
      title: "From top (%)",
      type: "number",
      validation: (rule) => rule.required().min(0).max(100),
    }),
    defineField({
      name: "height",
      title: "Height (%)",
      type: "number",
      validation: (rule) => rule.required().min(0).max(100),
    }),
  ],
  preview: {
    select: { label: "label", page: "pageNumber", target: "target" },
    prepare({ label, page, target }) {
      return { title: label || target, subtitle: `page ${page}` };
    },
  },
});
