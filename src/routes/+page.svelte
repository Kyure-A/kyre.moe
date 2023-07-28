<script lang="ts">
  import Affiliation from "../components/affiliation/index.svelte";
  import Interests from "../components/interests/index.svelte";
  import Qualifications from "../components/qualifications/index.svelte";  
</script>

<style lang="postcss">
  :global(html) {
    background-color: theme(colors.gray.100);
  }
  
</style>

<Affiliation />

<Interests />

<Qualifications />
