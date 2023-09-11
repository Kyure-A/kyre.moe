<script lang="ts">
  import Biography from "$components/biography/index.svelte";
  import Affiliation from "$components/affiliation/index.svelte";
  import Interests from "$components/interests/index.svelte";
  import Certification from "$components/certification/index.svelte";
  import Favorite from "$components/favorite/index.svelte"
  import Music from "$components/music/index.svelte"
  import Experience from "$components/experience/index.svelte"
</script>


<style>
</style>

<div class="text-[14px] flex flex-col justify-center">
  <Biography />

  <Affiliation />

  <Interests />

  <Favorite />

  <Music />

  <Experience />
  
  <Certification />
  
  <div class="py-10"></div>
</div>
