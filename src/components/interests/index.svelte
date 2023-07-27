<script>
  let interests = [
    {id: 1, value: "プログラミング"},
    {id: 2, value: "競技プログラミング"},
    {id: 3, value: "女装/コスプレ"},
  ]
</script>

<ul class="px-8">Interests
{#each interests as interest}
<li class="px-8">
  <a>{interest.value}</a>
</li>
{/each}
</ul>
