<script lang="ts">

  import { affiliations } from "../../constants/affiliations.ts";
  
  function formatDate (date: Date): string {
    const result: string = date.getFullYear().toString() + "/" + date.getMonth().toString();
    return result;
  }
  
</script>

<div>
<h2 class="px-8 font-bold text-lg text-[#f92672]">Affiliation</h2>

<ul class="px-8">
  {#each affiliations as affiliation}
    <li class="px-8">
      <a href={affiliation.link}>{affiliation.name}, {affiliation.course} ({formatDate(affiliation.start)} - {formatDate(affiliation.end)})</a>
    <li>
  {/each}
</ul>

</div>
