<script lang="ts">
  import Biography from "../components/biography/index.svelte"
  import Affiliation from "../components/affiliation/index.svelte";
  import Interests from "../components/interests/index.svelte";
  import Qualifications from "../components/qualifications/index.svelte";
</script>


<style>
  h2 {
    color: #F92672;
  }
</style>

<div class="flex flex-col justify-center">
  <Biography />

  <Affiliation />

  <Interests />

  <Qualifications />
</div>
