<script lang="ts">
import { Pencil, Trash2 } from '@lucide/svelte';
import { deleteCustomColor } from '$lib/stores/customColors';
import type { CustomColor } from '$lib/types';
import { rgbToRgb255 } from '$lib/utils/color/colorConversion';
import { formatRgbDisplay } from '$lib/utils/color/customColorUtils';
import * as Card from '$lib/components/ui/card';
import { Button } from '$lib/components/ui/button';

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

<Card.Root class="border border-border hover:shadow-md transition-shadow">
  <Card.Content class="p-4">
    <div class="flex items-center gap-3">
      <!-- 色プレビュー -->
      <button
        type="button"
        onclick={onSelect}
        class="size-12 rounded-lg border-2 border-border hover:border-primary transition-colors cursor-pointer"
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
          <div class="text-sm text-muted-foreground">RGB({rgbDisplay})</div>
        </button>
      </div>

      <!-- アクションボタン -->
      <div class="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onclick={onEdit}
          aria-label="編集"
        >
          <Pencil class="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="text-destructive hover:bg-destructive/10"
          onclick={handleDelete}
          aria-label="削除"
        >
          <Trash2 class="size-4" />
        </Button>
      </div>
    </div>
  </Card.Content>
</Card.Root>