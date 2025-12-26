<script lang="ts" module>
export type HeartBurstApi = {
  trigger: () => void;
};
</script>

<script lang="ts">
import { HEART_BURST } from '$lib/constants/timing';

type BurstHeart = { id: number; x: number; y: number };
let burstHearts = $state<BurstHeart[]>([]);
let burstId = 0;

export function trigger() {
  const count = HEART_BURST.MIN_COUNT + Math.floor(Math.random() * HEART_BURST.RANDOM_RANGE);
  const newHearts: BurstHeart[] = [];

  for (let i = 0; i < count; i++) {
    newHearts.push({
      id: burstId++,
      x: (Math.random() - 0.5) * HEART_BURST.X_RANGE, // ±12px
      y: -HEART_BURST.Y_BASE - Math.random() * HEART_BURST.Y_VARIATION, // -25〜-40px
    });
  }

  burstHearts = newHearts;

  setTimeout(() => {
    burstHearts = [];
  }, HEART_BURST.DURATION);
}
</script>

{#each burstHearts as heart (heart.id)}
  <span
    class="absolute left-1/2 top-1/2 text-red-500 text-sm animate-heart-burst"
    style="--burst-x: {heart.x}px; --burst-y: {heart.y}px;"
    aria-hidden="true"
  >♥</span>
{/each}
