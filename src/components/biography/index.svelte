<script>
  import { biography } from "../../constants/biography.ts"
</script>

<div>
<h2 class="px-8 font-bold text-lg text-[#f92672]">Biography</h2>

<ul class="px-8 list-disc list-inside">
  {#each biography as bio}
    <li class="px-8">{bio}</li>
  {/each}
</ul>
</div>
