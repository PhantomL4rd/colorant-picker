<script lang="ts" module>
export type HeartBurstApi = {
  trigger: () => void;
};
</script>

<script lang="ts">
type BurstHeart = { id: number; x: number; y: number };
let burstHearts = $state<BurstHeart[]>([]);
let burstId = 0;

export function trigger() {
  const count = 2 + Math.floor(Math.random() * 2); // 2〜3個
  const newHearts: BurstHeart[] = [];

  for (let i = 0; i < count; i++) {
    newHearts.push({
      id: burstId++,
      x: (Math.random() - 0.5) * 24, // ±12px
      y: -25 - Math.random() * 15, // -25〜-40px
    });
  }

  burstHearts = newHearts;

  setTimeout(() => {
    burstHearts = [];
  }, 600);
}
</script>

{#each burstHearts as heart (heart.id)}
  <span
    class="absolute left-1/2 top-1/2 text-red-500 text-sm animate-heart-burst"
    style="--burst-x: {heart.x}px; --burst-y: {heart.y}px;"
    aria-hidden="true"
  >♥</span>
{/each}
