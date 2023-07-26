<script>
  import { getAtCoderHighest } from "./getAtCoder.js";
  import { onMount } from 'svelte';

  let highest = 0;
  
  onMount(async () => {    
    highest = await getAtCoderHighest();
  });
  
</script>

<li>
  <p> AtCoder Algo Rating {highest} (highest)</p>
</li>
  
