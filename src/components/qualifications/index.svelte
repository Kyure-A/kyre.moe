<script lang="ts">
  import axios from "axios"
  
  async function getAtCoderHighest(): number {

    let highest: number;

    const contests = await fetch("https://atcoder.jp/users/kyre/history/json");

    for (let i = 0; i < contests.data.length; ++i) {
      highest = Math.max(contests.data[i].NewRating, highest);
    }

    return highest;
  }
  
</script>

<div>
<ul class="px-8 list-disc list-inside"><h2 class="font-bold text-lg text-[#f92672]">Qualifications</h2>
  <li class="px-8">
    <a>TOEIC L&R 465</a>
  </li>
  <li class="px-8">
    <a>Paiza プログラミングスキルチェック (S ランク)</a>
  </li>
  {#await getAtCoderHighest()}
    {:then highest}
      <li class="px-8">
	AtCoder Algo Rating {highest} (highest)
      </li>
    {/await}
</ul>
</div>
