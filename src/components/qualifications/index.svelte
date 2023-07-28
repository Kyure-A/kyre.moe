<script lang="ts">
  import axios from "axios"
  import { onMount } from 'svelte';

  let highest: number;
  
  async function getAtCoderHighest(): number {

    let highest: number;
    
    try {
      const contests = await axios.get("https://atcoder.jp/users/kyre/history/json");
      
      console.log(contests.data);
      for (let i = 0; i < contests.data.length; ++i) {
	highest = Math.max(contests.data[i].NewRating, highest);
      }
      console.log(highest);
      return highest;
    }

    catch {
      highest = -1;
      return highest;
    }
  }
  
  onMount(async () => {    
    let promise = await getAtCoderHighest();
    highest = promise;
  });
  
</script>

<ul class="px-8 list-disc list-inside"><p class="font-bold text-lg">Qualifications</p>
  <li class="px-8">
    <a>TOEIC L&R 465</a>
  </li>
  <li class="px-8">
    <a>Paiza プログラミングスキルチェック (S ランク)</a>
  </li>
  <li class="px-8">
    <p> AtCoder Algo Rating {highest} (highest)</p>
  </li>
</ul>
