<script>
  import Accounts from "../components/accounts/index.svelte";
  import Affiliation from "../components/affiliation/index.svelte";
  import Interests from "../components/interests/index.svelte";
  import Qualifications from "../components/qualifications/index.svelte";

  // import Fa from 'svelte-fa/src/fa.svelte'
  //   import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons/index.es'

  
</script>

<div class="flex flex-row">
  <h1 class="text-3xl p-8 font-bold">Kyure_A</h1>
  <img class="w-32 h-32 rounded-full" src="/kyure_a.jpg" alt="" width="384" height="512">
</div>

<style lang="postcss">
  :global(html) {
    background-color: theme(colors.gray.100);
  }
  
</style>

<Accounts />

<Affiliation />

<Interests />

<Qualifications />
