<script lang="ts">
  import { accounts } from "../../accounts.ts"
</script>

<!-- <FontAwesomeIcon icon={['fas', 'smile-wink']} size="xs" /> -->
<ul class="px-8"><p class="font-bold text-lg">Accounts</p>
  
  <i class="fa-brands fa-twitter"></i>
  <ul class="px-8 list-disc list-inside"><p class="font-bold">Twitter</p>
    {#each accounts as account}
      {#if account.type == "Twitter"}
	<li class="px-8">
	  <a href={account.url}>{account.name}</a>
	</li>
      {/if}
    {/each}
  </ul>

  <ul class="px-8 list-disc list-inside"><p class="font-bold">Fediverse</p>
    {#each accounts as account}
      {#if account.type == "Fediverse"}
	<li class="px-8">
	  <a href={account.url}>{account.name}</a>
	</li>
      {/if}
    {/each}
  </ul>

    <ul class="px-8 list-disc list-inside"><p class="font-bold">Development</p>
    {#each accounts as account}
      {#if account.type == "Development"}
	<li class="px-8">
	  <a href={account.url}>{account.name}</a>
	</li>
      {/if}
    {/each}
  </ul>
  
  <ul class="px-8 list-disc list-inside"><p class="font-bold">Games</p>
    {#each accounts as account}
      {#if account.type == "Games"}
	<li class="px-8">
	  <a href={account.url}>{account.name}</a>
	</li>
      {/if}
    {/each}
  </ul>
  
  <ul class="px-8 list-disc list-inside"><p class="font-bold">Others</p>
    {#each accounts as account}
      {#if account.type == "Others"}    
	<li class="px-8">
	  <a href={account.url}>{account.name}</a>
	{/if}
      {/each}
    </ul>
  
</ul>
