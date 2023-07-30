<script>
  import { interests } from "../../constants/interests.ts"
</script>

<div>
<ul class="px-8 list-disc list-inside"><h2 class="font-bold text-lg text-[#f92672]">Interests</h2>
  {#each interests as interest}
    <li class="px-8">
      {interest.parent}
      {#if interest.child != []}
	{#each interest.child as child}
	  <li class="px-8">
	    {child}
	  </li>
	{/each}
      {/if}
    </li>
  {/each}
</ul>
</div>
