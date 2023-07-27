<script lang="ts">
  import { accounts } from "../../accounts.ts"
</script>

<!-- <FontAwesomeIcon icon={['fas', 'smile-wink']} size="xs" /> -->
<ul class="px-8">Accounts
  
  <i class="fa-brands fa-twitter"></i>
  <ul class="px-8">Twitter
    {#each accounts as account}
      {#if account.type == "Twitter"}
	<li class="px-8">
	  <a href={account.url}>{account.name}</a>
	</li>
      {/if}
    {/each}
  </ul>

  <ul class="px-8">Fediverse
    {#each accounts as account}
      {#if account.type == "Fediverse"}
	<li class="px-8">
	  <a href={account.url}>{account.name}</a>
	</li>
      {/if}
    {/each}
  </ul>
  
  <ul class="px-8">Games
    {#each accounts as account}
      {#if account.type == "Games"}
	<li class="px-8">
	  <a href={account.url}>{account.name}</a>
	</li>
      {/if}
    {/each}
  </ul>
  
  <ul class="px-8">Others
    {#each accounts as account}
      {#if account.type == "Others"}    
	<li class="px-8">
	  <a href={account.url}>{account.name}</a>
	{/if}
      {/each}
    </ul>
  
</ul>
