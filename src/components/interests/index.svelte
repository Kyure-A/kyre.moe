<script>
  import { interests } from "../../constants/interests.ts"
</script>

<div>
<ul class="px-8 list-disc list-inside"><h2 class="font-bold text-lg text-[#f92672]">Interests</h2>
  {#each interests as interest}
    <p class="px-8 font-bold pr-2 text-[#fd971f]"> {interest.parent}</p>
      {#if interest.child != []}
	{#each interest.child as child}
	  <li class="px-16">
	    {child}
	  </li>
	{/each}
      {/if}
  {/each}
</ul>
</div>
