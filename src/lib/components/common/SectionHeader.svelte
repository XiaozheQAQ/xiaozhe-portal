<script lang="ts">
  let { title, href = '', action = '查看全部', icon = '' }: { title: string; href?: string; action?: string; icon?: string } = $props();
</script>

<div class="section-header">
  <h2>{#if icon}<i class={`${icon} section-header-icon`} aria-hidden="true"></i>{/if}{title}</h2>
  {#if href}<a href={href}>{action} <span>→</span></a>{/if}
</div>
