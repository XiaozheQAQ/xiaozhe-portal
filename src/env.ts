import { defineEnvVars } from '@sveltejs/kit/env';

/**
 * Environment variables this app reads.
 *
 * Every entry carries a schema that turns a missing value into an empty string,
 * so the project builds and runs with no configuration at all — the affected
 * feature then reports that it is unavailable instead of inventing data.
 */
export const variables = defineEnvVars({
  UPSTASH_REDIS_REST_URL: {
    description: 'Upstash Redis REST endpoint for article view counts (server-side only).',
    schema: (value: string | undefined) => value ?? ''
  },
  UPSTASH_REDIS_REST_TOKEN: {
    description: 'Upstash Redis REST token for article view counts (server-side only).',
    schema: (value: string | undefined) => value ?? ''
  },
  LXNS_DEVELOPER_API_KEY: {
    description: 'LXNS 落雪查分器 developer API key for the maimai DX archive (server-side only).',
    schema: (value: string | undefined) => value ?? ''
  },
  MAIMAI_FRIEND_CODE: {
    description: 'Friend code of the maimai DX player whose archive the status page shows.',
    schema: (value: string | undefined) => value ?? ''
  },
  PUBLIC_GISCUS_REPO: {
    public: true,
    static: true,
    description: 'Repository that stores the comment discussions, e.g. owner/name.',
    schema: (value: string | undefined) => value ?? ''
  },
  PUBLIC_GISCUS_REPO_ID: {
    public: true,
    static: true,
    description: 'Public repository node_id used by giscus.',
    schema: (value: string | undefined) => value ?? ''
  },
  PUBLIC_GISCUS_CATEGORY: {
    public: true,
    static: true,
    description: 'Discussion category name used by giscus.',
    schema: (value: string | undefined) => value ?? ''
  },
  PUBLIC_GISCUS_CATEGORY_ID: {
    public: true,
    static: true,
    description: 'Public discussion category id used by giscus.',
    schema: (value: string | undefined) => value ?? ''
  }
});
