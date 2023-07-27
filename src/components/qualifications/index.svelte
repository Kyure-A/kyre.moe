<script>
  import axios from "axios"
  import { onMount } from 'svelte';
  
  async function getAtCoderHighest() {

    try {
      let highest = 0;
      const contests = await axios.get("https://atcoder.jp/users/kyre/history/json");

      console.log(contests.data);
      for (let i = 0; i < contests.data.length; ++i) {
	highest = Math.max(contests.data[i].NewRating, highest);
      }
      console.log(highest);
      return highest;
    }

    catch {
      let highest = "eeee";
      return highest;
    }
  }
  
  onMount(async () => {    
    let promise = await getAtCoderHighest();
  });
  
</script>

<ul class="px-8 list-disc list-inside"><p class="font-bold text-lg">Qualifications</p>
  <li class="px-8">
    <a>TOEIC L&R 465</a>
  </li>
  <li class="px-8">
    <a>Paiza プログラミングスキルチェック (S ランク)</a>
  </li>
</ul>
<!-- {#await promise} -->
<!--   {:then highest} -->
<!--     <li> -->
<!--       <p> AtCoder Algo Rating {highest} (highest)</p> -->
<!--     </li> -->
<!--   {:catch error} -->
<!--     <p>error</p> -->
<!-- {/await} -->
