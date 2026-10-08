<script lang="ts">
  let { title, href = '', action = '查看全部' }: { title: string; href?: string; action?: string } = $props();
</script>

<div class="section-header">
  <h2>{title}</h2>
  {#if href}<a href={href}>{action} <span>→</span></a>{/if}
</div>
