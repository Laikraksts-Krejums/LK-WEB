import { defineField, defineType } from "sanity";

/**
 * Singleton. Kept separate from Site Settings because these values are
 * consumed by the per-issue hotspot "Links to" targets (instagram/facebook/
 * email), not by site metadata: editing a handle here updates every hotspot
 * in every issue at once.
 */
export const socialLinks = defineType({
  name: "socialLinks",
  title: "Social links",
  type: "document",
  fields: [
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
  ],
  preview: {
    prepare: () => ({ title: "Social links" }),
  },
});
