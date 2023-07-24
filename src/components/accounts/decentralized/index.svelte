<script>
  let accounts = [
    {name: "mstdn.maud.io", url: "https://mstdn.maud.io/@Kyure_A"},
    {name: "misskey.io", url: "https://misskey.io/@Kyure_A"},
    {name: "Nostr", url: "https://snort.social/p/npub1u66qnxs3gth2tx944u66xh8x7qp5sjj3xmh25dqa846jpk74229swuetxg"},
  ]
</script>

<h3>Decentralized SNS</h3>
{#each accounts as account}
  <li>
    <a href={account.url}>{account.name}</a>
  </li>
{/each}
