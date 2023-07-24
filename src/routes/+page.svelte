<script>
  import Accounts from "../components/accounts/index.svelte";
  import Affiliation from "../components/affiliation/index.svelte";
  import Interests from "../components/interests/index.svelte";
  import Qualifications from "../components/qualifications/index.svelte";
</script>

<h1 class="text-3xl font-bold underline">Kyure_A</h1>

<style lang="postcss">
  :global(html) {
    background-color: theme(colors.gray.100);
  }
</style>

<Accounts />

<Affiliation />

<Interests />

<Qualifications />
