<script lang="ts">
  import Biography from "../components/biography/index.svelte";
  import Affiliation from "../components/affiliation/index.svelte";
  import Interests from "../components/interests/index.svelte";
  import Qualifications from "../components/qualifications/index.svelte";
  import Favorite from "../components/favorite/index.svelte"
  import Music from "../components/music/index.svelte"
</script>


<style>
  
</style>

<div class="flex flex-col justify-center">
  <Biography />

  <Affiliation />

  <Interests />

  <Favorite />

  <Music />
  
  <Qualifications />
</div>
