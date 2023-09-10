<script lang="ts">
  import { qualifications } from "../../constants/qualifications.ts"
  import axios from "axios";
  import { onMount } from "svelte";
  
  async function getAtCoderHighest(): number {

    let highest: number;

    const contests = await fetch("https://atcoder.jp/users/kyre/history/json");

    for (let i = 0; i < contests.data.length; ++i) {
      highest = Math.max(contests.data[i].NewRating, highest);
    }

    return highest;
  }

  onMount(async () => {
    const highest = await getAtCoderHighest();
  });
  
</script>

<div>
  <ul class="px-8 list-disc list-inside"><h2 class="font-bold text-lg text-[#f92672]">Certification</h2>
      {#each qualifications as qualification}
	<li class="px-8">
	  {qualification}
        </li>
      {/each}
    {#await getAtCoderHighest()}
      {:then highest}
	<li class="px-8">
	  AtCoder Algo Rating {highest} (highest)
	</li>
      {/await}
    </ul>
</div>
