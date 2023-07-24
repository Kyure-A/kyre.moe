<script>
  let interests = [
    {id: 1, value: "プログラミング"},
    {id: 2, value: "競技プログラミング"},
    {id: 3, value: "女装/コスプレ"},
  ]
</script>

<h2>Interests</h2>
{#each interests as interest}
<li>
  <p>{interest.value}</p>
</li>
{/each}
