<script lang="ts">
  import { accounts } from "../../constants/index.ts"
  import { TwitterBrand, GithubBrand, DiscordBrand, SteamBrand, LastfmBrand, InstagramBrand } from 'svelte-awesome-icons';
</script>

<ul class="px-8">
  <h2 class="font-bold text-lg text-[#f92672]">Accounts</h2>
  
  <ul class="px-8 list-disc list-inside">
    {#each accounts as account}
      <p class="font-bold pr-2">{account.parent}</p>
      {#if account.child != []}
	{#each account.child as child}
	  <li class="px-8">
	  <a href={child.url}>{child.name}</a>
	  </li>
	{/each}
      {/if}
    {/each}
    
  </ul>
  
</ul>
