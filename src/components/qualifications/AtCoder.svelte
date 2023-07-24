<script>
  import {getAtCoderHighest} from "./getAtCoder.js";
  
  let promise = getAtCoderHighest();
</script>

{#await promise}

  {:then rating}
    <li>
      <p> AtCoder Algo Rating: {rating}</p>
    </li>
    
{/await}
  
