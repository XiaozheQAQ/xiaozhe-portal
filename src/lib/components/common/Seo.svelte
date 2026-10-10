<script lang="ts">
  import { useI18n } from '#lib/i18n';
  import {
    DEFAULT_OG_IMAGE,
    SITE_NAME,
    absoluteUrl,
    canonicalUrl,
    ogLocale,
    type JsonLd
  } from '#lib/seo/meta';

  type Props = {
    title: string;
    description: string;
    /** Site-absolute path of this page; defaults to the page being rendered. */
    path?: string;
    type?: 'website' | 'article' | 'profile';
    image?: string;
    published?: string;
    modified?: string;
    tags?: string[];
    noindex?: boolean;
    jsonLd?: (JsonLd | undefined | null | false)[];
  };

  let {
    title,
    description,
    path = '',
    type = 'website',
    image,
    published,
    modified,
    tags = [],
    noindex = false,
    jsonLd = []
  }: Props = $props();

  const i18n = useI18n();
  const canonical = $derived(canonicalUrl(path || (typeof window === 'undefined' ? '/' : window.location.pathname)));
  const ogImage = $derived(absoluteUrl(image || DEFAULT_OG_IMAGE));
  const blocks = $derived(jsonLd.filter(Boolean) as JsonLd[]);
  /* A script element is raw text, so Svelte will not interpolate inside one: the
     tag has to be built as a string and injected whole. The escape keeps content
     that happens to spell a closing script tag from ending the block early. */
  const structuredData = $derived(
    blocks
      .map((block) => `<script type="application/ld+json">${JSON.stringify(block).replace(/</g, '\\u003c')}</scr` + `ipt>`)
      .join('')
  );
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="language" content={$i18n} />
  {#if noindex}
    <meta name="robots" content="noindex, follow" />
  {:else}
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  {/if}
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content={type} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:alt" content={title} />
  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:locale" content={ogLocale($i18n)} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />
  {#if published}<meta property="article:published_time" content={published} />{/if}
  {#if modified}<meta property="article:modified_time" content={modified} />{/if}
  {#each tags as tag}<meta property="article:tag" content={tag} />{/each}
  {@html structuredData}
</svelte:head>
