<script lang="ts">
  import "../app.css";  
</script>

<style lang="postcss">
  :global(html) {
    background-color: #272822;
    color: #FFFFFF;
  }

</style>

<header>
  <nav class="px-8 py-4 text-right">
    <a href="/" class="px-2">Accounts</a>
    <a href="/about" class="px-2">About</a>
    <a href="/blog" class="px-2">Blog</a>
    <hr class="h-px my-4 bg-gray-200 border-0 dark:bg-gray-700">
  </nav>
  
  <div class="flex flex-row">
    <h1 class="text-3xl p-8 font-bold">Kyure_A</h1>
    <img class="w-32 h-32 rounded-full" src="/kyure_a.jpg" alt="" width="384" height="512">
  </div>
</header>

<slot />
