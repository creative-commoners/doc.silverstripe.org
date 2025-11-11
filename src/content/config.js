import { defineCollection, z } from 'astro:content';

const docsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
    summary: z.string().optional(),
    introduction: z.string().optional(),
    icon: z.string().default('file-alt'),
    iconBrand: z.string().optional(),
    hideChildren: z.boolean().default(false),
    hide: z.boolean().default(false),
    order: z.number().optional(),
  }),
});

export const collections = {
  docs: docsCollection,
};
