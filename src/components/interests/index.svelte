<script>
  let interests = [
    {id: 1, value: "プログラミング"},
    {id: 2, value: "競技プログラミング"},
    {id: 3, value: "女装/コスプレ"},
    {id: 4, value: "筋トレ"}
  ]
</script>

<ul class="px-8 list-disc list-inside"><p class="font-bold text-lg">Interests</p>
{#each interests as interest}
<li class="px-8">
  <a>{interest.value}</a>
</li>
{/each}
</ul>
