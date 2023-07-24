<script>
  let games = [
    {name: "Steam", url: "https://steamcommunity.com/id/kyure_a/"},
    {name: "Epic Games", url: "https://store.epicgames.com/ja/u/6637d18ee37d470b9e17de1784812aa0"},
    {name: "Minecraft", url: "https://ja.namemc.com/profile/Kyure_A"},
  ]
</script>

<h3>Games</h3>
{#each games as game}
  <li>
    <a href={game.url}>{game.name}</a>
  </li>
{/each}
