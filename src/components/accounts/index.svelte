<script>
 
  const accounts = [
    {
      type: "Twitter",
      name: "@kyureq (Main)",
      url: "https://twitter.com/kyureq",
      id: "@kyureq"
    },
    {
      type: "Twitter",
      name: "@Kyure_A (Suspended)",
      url: "https://twitter.com/Kyure_A",
      id: "@Kyure_A"
    },
    {
      type: "Twitter",
      name: "@Xyure_A (Private)",
      url: "https://twitter.com/Xyure_A",
      id: "@Xyure_A"
    },
    {
      type: "Twitter",
      name: "@3kyu4 (cosplay)",
      url: "https://twitter.com/3kyu4",
      id: "@3kyu4"
    },
    {
      type: "Development",
      name: "GitHub",
      url: "https://github.com/Kyure-A",
      id: "Kyure-A"
    },
    {
      type: "Development",
      name: "AtCoder",
      url: "https://atcoder.jp/users/kyre",
      id: "kyre"
    },
    {
      type: "Fediverse",
      name: "@Kyure_A@mstdn.maud.io",
      url: "https://mstdn.maud.io/@Kyure_A",
      id: "@Kyure_A@mstdn.maud.io"
    },
    {
      type: "Fediverse",
      name: "@Kyure_A@misskey.io",
      url: "https://misskey.io/@Kyure_A",
      id: "@Kyure_A@misskey.io"
    },
    {
      type: "Fediverse",
      name: "@kyre@misskey.kyoupro.com",
      url: "https://misskey.kyoupro.com/@kyre"
    },
    {
      type: "Fediverse",
      name: "@Kyure_A@mstdn.jp",
      url: "https://mstdn.jp/@Kyure_A"
    },
    {
      type: "Games",
      name: "Steam",
      url: "https://steamcommunity.com/id/kyure_a/"
    },
    {
      type: "Games",
      name: "Epic Games",
      url: "https://store.epicgames.com/ja/u/6637d18ee37d470b9e17de1784812aa0"
    },
    {
      type: "Games",
      name: "Minecraft",
      url: "https://ja.namemc.com/profile/Kyure_A"
    },
    {
      type: "Games",
      name: "CHUNITHM (Chunirec)",
      url: "https://chunirec.net/users/kyre"
    },
    {
      type: "Games",
      name: "umamusume",
      url: "",
      id: "785561379876"
    },
    {
      type: "Games",
      name: "Arcaea",
      url: "",
      id: "669 602 127"
    },
    {
      type: "Others",
      name: "Discord",
      url: "",
      id: "kyure_a"
    },
    {
      type: "Others",
      name: "Instagram",
      url: "https://instagram.com/kyure_a",
      id: "kyure_a"
    },
    {
      type: "Others",
      name: "Threads",
      url: "https://www.threads.net/@kyure_a",
      id: "kyure_a"
    },
    {
      type: "Others",
      name: "Last.fm",
      url: "https://www.last.fm/user/Kyure_A",
      id: "Kyure_A"
    },
    {
      type: "Games",
      name: "Nintendo Switch",
      url: "",
      id: "SW-1698-6437-2977"
    },
    {
      type: "Others",
      name: "Nostr",
      url: "https://snort.social/p/npub1u66qnxs3gth2tx944u66xh8x7qp5sjj3xmh25dqa846jpk74229swuetxg",
      id: "npub1u66qnxs3gth2tx944u66xh8x7qp5sjj3xmh25dqa846jpk74229swuetxg"
    },
    {
      type: "Games",
      name: "モンスターストライク",
      url: "",
      id: "163012306"
    }
  ];
  
</script>

<!-- <FontAwesomeIcon icon={['fas', 'smile-wink']} size="xs" /> -->
<ul class="px-8">Accounts
  
  <i class="fa-brands fa-twitter"></i>
  <ul class="px-8">Twitter
    {#each accounts as account}
      {#if account.type == "Twitter"}
	<li class="px-8">
	  <a href={account.url}>{account.name}</a>
	</li>
      {/if}
    {/each}
  </ul>

  <ul class="px-8">Fediverse
    {#each accounts as account}
      {#if account.type == "Fediverse"}
	<li class="px-8">
	  <a href={account.url}>{account.name}</a>
	</li>
      {/if}
    {/each}
  </ul>
  
  <ul class="px-8">Games
    {#each accounts as account}
      {#if account.type == "Games"}
	<li class="px-8">
	  <a href={account.url}>{account.name}</a>
	</li>
      {/if}
    {/each}
  </ul>
  
  <ul class="px-8">Others
    {#each accounts as account}
      {#if account.type == "Others"}    
	<li class="px-8">
	  <a href={account.url}>{account.name}</a>
	{/if}
      {/each}
    </ul>
  
</ul>
