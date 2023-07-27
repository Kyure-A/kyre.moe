<script lang="ts">
  
  let affiliations = [
    {
      name: "Osaka Metropolitan University College of Technology",
      course: "Electronics and Information Course",
      start: new Date("2021/04/01"),
      end: "",
      link: "https://www.ct.omu.ac.jp"
    },
  ];

  function formatDate (date: Date) {
    const result: string = date.getFullYear().toString() + "/" + date.getMonth().toString();
    return result;
  }
  
</script>

<h2 class="px-8">Affiliation</h2>

<ul class="px-8">
  {#each affiliations as affiliation}
    <li class="px-8">
      <a href={affiliation.link}>{affiliation.name}, {affiliation.course}, ({affiliation.start} - {affiliation.end})</a>
    <li>
  {/each}
</ul>
