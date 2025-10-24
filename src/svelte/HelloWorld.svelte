<script lang="ts">
  // 🧠 Runes-Modus: alle Reaktiven Variablen mit `$state`
  let name = $state("Andi");
  let count = $state(0);

  // Abgeleiteter Zustand (reagiert auf count)
  const greeting = $derived(() => `Hallo ${name}! Du hast ${count}x geklickt.`);

  // Side-Effect (wird ausgeführt, wenn count sich ändert)
  $effect(() => {
    console.log(`Zähler steht jetzt auf ${count}`);
  });

  function increment() {
    count = count + 1;
  }
</script>

<!-- 🎨 Markup -->
<div class="p-4 bg-neutral-800 text-neutral-100 rounded-2xl shadow-md w-fit">
  <h2 class="text-xl font-bold mb-2">👋 {greeting}</h2>

  <input
    class="border rounded p-1 bg-neutral-700"
    type="text"
    bind:value={name}
    placeholder="Dein Name"
  />

  <button class="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded" onclick={increment}>
    Klick mich!
  </button>
</div>
