<script lang="ts">
  import { accounts } from "../../constants/accounts.ts"
  import { TwitterBrand, GithubBrand, DiscordBrand, SteamBrand, LastfmBrand, InstagramBrand } from 'svelte-awesome-icons';
</script>

<div>
  <h2 class="px-8 font-bold text-lg text-[#f92672]">Accounts</h2>
  <ul class="px-8 list-disc list-inside">
    {#each accounts as account}
      <p class="px-8 font-bold pr-2 text-[#fd971f]">{account.parent}</p>
      {#if account.child != []}
	{#each account.child as child}
	  <li class="px-16">
	  <a href={child.url}>{child.name}</a>
	  </li>
	{/each}
      {/if}
    {/each}
  </ul>
</div>
