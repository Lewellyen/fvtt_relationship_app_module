<!--
  DEMO COMPONENT - Example Svelte 5 component using Runes syntax.
  This is kept as a reference for Svelte 5 integration patterns.
  Not currently used in production code.
-->
<script lang="ts">
  let name = $state("World");
</script>

<h1>Hello {name}</h1>
