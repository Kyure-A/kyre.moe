<script>
  let accounts = [
    {type: "Twitter", name: "main", url: "https://twitter.com/kyureq"},
    {type: "Twitter", name: "cosplay", url: "https://twitter.com/3kyu4"}
  ]
  
</script>

<h2>Accounts</h2>
{#each accounts as account}
  <li>
    <a href={account.url}>{account.name}</a>
  </li>
{/each}
