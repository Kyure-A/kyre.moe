<script>
  let accounts = [
    {name: "main", url: "https://twitter.com/kyureq"},
    {name: "Suspended", url: "https://twitter.com/Kyure_A"},
    {name: "Private", url: "https://twitter.com/Xyure_A"},
    {name: "cosplay", url: "https://twitter.com/3kyu4"},
  ]
</script>

<h3>Twitter</h3>
{#each accounts as account}
  <li>
    <a href={account.url}>{account.name}</a>
  </li>
{/each}
