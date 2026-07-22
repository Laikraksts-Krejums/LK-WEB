import { defineField, defineType } from "sanity";

export const siteLink = defineType({
  name: "siteLink",
  title: "Link",
  type: "document",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      description: 'Internal name shown in pickers, e.g. "Instagram".',
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "url",
      title: "URL",
      description: "A web address, or a mailto: link for an email address.",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "url" },
  },
});
