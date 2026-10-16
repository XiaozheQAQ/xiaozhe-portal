/**
 * EdgeOne Makers adapter for this project.
 *
 * It IS the official @edgeone/sveltekit adapter, wrapped with two compatibility
 * fixes. The .edgeone Build Output API v3 layout, config.json routes, ISR manifests
 * and dependency tracing all remain the official adapter's own code.
 *
 * 1. SvelteKit 3 removed builder.generateManifest() (error
 *    adapter_generate_manifest_removed, "use generateServerInstance or
 *    builder.manifest instead") and now emits
 *    .svelte-kit/output/server/manifest.js itself - exactly the module the Server
 *    class consumes. The bridge hands the official adapter a generateManifest()
 *    that re-exports that module.
 *
 * 2. The official dependency-copy step assumes a POSIX build host: it splits nft's
 *    POSIX file list with path.sep and derives the wrapper's import specifier from
 *    the filesystem root. On Linux (EdgeOne's build image) that yields
 *    ./.svelte-kit/edgeone-tmp/handler.js; on Windows it yields an unresolvable
 *    drive-relative path. We re-point the wrapper only when the specifier does not
 *    resolve, so the Linux output is left exactly as the official adapter wrote it.
 */
import edgeone from '@edgeone/sveltekit';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const kitVersion = createRequire(import.meta.url)('@sveltejs/kit/package.json').version;
const kitMajor = Number(kitVersion.split('.')[0]);

/**
 * The source expression that SvelteKit 2's generateManifest() used to produce for the
 * manifest module SvelteKit 3 writes next to the server bundle.
 *
 * @param {{ relativePath?: string }} [options]
 * @returns {string}
 */
function manifestSource(options) {
  const relativePath = (options && options.relativePath) || './server';
  return "(await import('" + relativePath + "/manifest.js')).manifest";
}

/**
 * @param {any} builder
 * @returns {any}
 */
function withManifestBridge(builder) {
  // SvelteKit 2 still has a working generateManifest(); only 3 needs the bridge.
  if (kitMajor < 3) return builder;

  return new Proxy(builder, {
    get(target, property, receiver) {
      if (property === 'generateManifest') return manifestSource;
      return Reflect.get(target, property, receiver);
    }
  });
}

/**
 * @param {string} dir
 * @param {number} depth
 * @returns {string | null}
 */
function findCopiedEntry(dir, depth) {
  if (depth > 12) return null;

  /** @type {import('node:fs').Dirent[]} */
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findCopiedEntry(full, depth + 1);
      if (found) return found;
    } else if (entry.name === 'handler.js' && full.includes('edgeone-tmp')) {
      return full;
    }
  }

  return null;
}

/**
 * @param {string} serverDir
 * @returns {void}
 */
function repairHandlerEntry(serverDir) {
  const wrapper = resolve(serverDir, 'handler.js');
  if (!existsSync(wrapper)) return;

  const source = readFileSync(wrapper, 'utf8');
  const match = source.match(/from\s+'([^']+)'/);
  if (!match) return;

  const specifier = match[1];
  if (existsSync(resolve(serverDir, specifier))) return;

  const copied = findCopiedEntry(serverDir, 0);
  if (!copied) return;

  const fixed = './' + relative(serverDir, copied).split(sep).join('/');
  writeFileSync(wrapper, source.replace(specifier, fixed), 'utf8');
  console.log('  handler entry re-pointed to ' + fixed);
}

/** @returns {import('@sveltejs/kit').Adapter} */
export default function edgeoneAdapter() {
  const adapter = edgeone();
  return {
    name: adapter.name,
    supports: adapter.supports,
    async adapt(builder) {
      await adapter.adapt(withManifestBridge(builder));
      repairHandlerEntry(join('.edgeone', 'cloud-functions', 'ssr-node'));
    }
  };
}