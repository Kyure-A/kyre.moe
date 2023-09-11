<script>
  import { favorite } from "../../constants/favorite.ts"
</script>

<div>
  <h2 class="px-8 font-bold text-lg text-[#f92672]">Favorite</h2>
  <ul class="px-8 list-disc list-inside text-[#fd971f]">
    {#each favorite as thing}
      <p class="px-8 font-bold pr-2 text-[#fd971f]">{thing.parent}</p>
      {#if thing.child != []}
	{#each thing.child as child}
	  <li class="px-16 text-[#FFFFFF]">
	    『{child}』
	  </li>
	{/each}
      {/if}
    {/each}
  </ul>
</div>
