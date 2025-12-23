<script lang="ts">
import { deleteCustomColor } from '$lib/stores/customColors';
import { formatRgbDisplay } from '$lib/utils/customColorUtils';
import { rgbToRgb255 } from '$lib/utils/colorConversion';
import type { CustomColor } from '$lib/types';
import { Pencil, Trash2 } from '@lucide/svelte';

interface Props {
  color: CustomColor;
  onSelect: () => void;
  onEdit: () => void;
}

let { color, onSelect, onEdit }: Props = $props();

// culori形式(0-1)を0-255に変換して表示
const rgb255 = $derived(rgbToRgb255(color.rgb));
const colorStyle = $derived(`rgb(${rgb255.r}, ${rgb255.g}, ${rgb255.b})`);
const rgbDisplay = $derived(formatRgbDisplay(rgb255));

function handleDelete() {
  if (confirm(`「${color.name}」を削除しますか？`)) {
    deleteCustomColor(color.id);
  }
}
</script>

<div class="card bg-base-100 border border-base-300 hover:shadow-md transition-shadow">
  <div class="card-body p-4">
    <div class="flex items-center gap-3">
      <!-- 色プレビュー -->
      <button
        type="button"
        onclick={onSelect}
        class="w-12 h-12 rounded-lg border-2 border-base-300 hover:border-primary transition-colors cursor-pointer"
        style="background-color: {colorStyle}"
        title="この色を選択"
        aria-label="{color.name}の色を選択"
      ></button>

      <!-- 色情報 -->
      <div class="flex-1 min-w-0">
        <button
          type="button"
          onclick={onSelect}
          class="text-left hover:text-primary transition-colors cursor-pointer block w-full"
        >
          <div class="font-medium text-base text-balance">{color.name}</div>
          <div class="text-sm text-gray-500">RGB({rgbDisplay})</div>
        </button>
      </div>

      <!-- アクションボタン -->
      <div class="flex gap-1">
        <button
          type="button"
          onclick={onEdit}
          class="btn btn-ghost btn-sm"
          title="編集"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          onclick={handleDelete}
          class="btn btn-ghost btn-sm text-error hover:bg-error/10"
          title="削除"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  </div>
</div>