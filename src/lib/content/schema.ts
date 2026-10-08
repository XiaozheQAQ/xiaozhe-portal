import { z } from 'zod';

export const blogSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.coerce.string(),
  language: z.enum(['zh-CN', 'en']).default('zh-CN'),
  updated: z.string().optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  cover: z.string().optional(),
  slug: z.string().optional()
});

export const projectSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['active', 'experimental', 'maintenance', 'archived']).default('active'),
  tech: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  github: z.string().optional(),
  demo: z.string().optional(),
  slug: z.string().optional()
});

export const labSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['active', 'experimental', 'done', 'archived']).default('experimental'),
  date: z.coerce.string(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  slug: z.string().optional()
});

export type BlogFrontmatter = z.infer<typeof blogSchema>;
export type ProjectFrontmatter = z.infer<typeof projectSchema>;
export type LabFrontmatter = z.infer<typeof labSchema>;
