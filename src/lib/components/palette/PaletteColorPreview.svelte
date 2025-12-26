<script lang="ts">
interface ColorInfo {
  hex: string;
  name: string;
}

interface Props {
  colors: [ColorInfo, ColorInfo, ColorInfo];
  onSelect?: () => void;
}

const { colors, onSelect }: Props = $props();
</script>

<button
  type="button"
  class="grid grid-cols-3 gap-2 w-full {onSelect ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}"
  onclick={onSelect}
  disabled={!onSelect}
  aria-label="この組み合わせを選択"
>
  {#each colors as color}
    <div class="text-center">
      <div
        class="w-full h-16 md:h-18 rounded-lg border-2 border-base-300"
        style="background-color: {color.hex};"
        title={color.name}
      ></div>
      <div class="text-xs mt-1 text-balance" title={color.name}>
        {color.name}
      </div>
    </div>
  {/each}
</button>
