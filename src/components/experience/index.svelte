<script>
  import { experience } from "../../constants/experience.ts"
</script>

<div>
  <h2 class="px-8 font-bold text-lg text-[#f92672]">Experience</h2>
  <ul class="px-8 list-disc list-inside text-[#fd971f]">
    {#each experience as thing}
      {#if thing.public}
	<a href="{thing.url}" class="px-8 font-bold pr-2 text-[#fd971f]">{thing.name}</a>
	{#if thing.team != []}
	  <li class="px-16 text-[#FFFFFF]">
	    チーム名 「{thing.team}」
	  </li>
	{/if}
	{#if thing.result != [] && thing.result_url != []}
	  <li class="px-16 text-[#FFFFFF]">
	    <a href={thing.result_url}>{thing.result}</a>
	  </li>
	{/if}
	{#if thing.description}
	  <li class="px-16 text-[#FFFFFF]">
	    {thing.description}
	  </li>
	{/if}
      {/if}
    {/each}
  </ul>
</div>
