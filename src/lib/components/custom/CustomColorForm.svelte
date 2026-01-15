<script lang="ts">
import { Loader2, Save, X } from '@lucide/svelte';
import {
  customColorsStore,
  isNameDuplicate,
  saveCustomColor,
  updateCustomColor,
} from '$lib/stores/customColors';
import { t } from '$lib/translations';
import type { RGBColor255 } from '$lib/types';
import { rgbToRgb255 } from '$lib/utils/color/colorConversion';
import {
  formatRgbDisplay,
  validateCustomColorName,
  validateRgbInput,
} from '$lib/utils/color/customColorUtils';
import * as Card from '$lib/components/ui/card';
import { Button } from '$lib/components/ui/button';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import * as Alert from '$lib/components/ui/alert';

interface Props {
  editColorId?: string | null;
  onClose: () => void;
}

let { editColorId = null, onClose }: Props = $props();

// 編集対象のカスタムカラーを取得
const editingColor = $derived(
  editColorId ? $customColorsStore.find((color) => color.id === editColorId) || null : null
);

// フォーム状態
let name = $state('');
let rgbInputs = $state({ r: 0, g: 0, b: 0 });
let errors = $state<{ name?: string; rgb?: string; submit?: string }>({});
let isSubmitting = $state(false);

// 編集時の初期値設定
$effect(() => {
  const color = editingColor;
  if (color) {
    name = color.name;
    // culori Rgb (0-1) から 0-255 に変換
    rgbInputs = rgbToRgb255(color.rgb);
  } else {
    name = '';
    rgbInputs = { r: 120, g: 85, b: 45 }; // デフォルト値（髪色っぽい色）
  }
  errors = {};
});

// プレビュー色の計算
let previewColor = $derived(
  validateRgbInput(rgbInputs) ? `rgb(${rgbInputs.r}, ${rgbInputs.g}, ${rgbInputs.b})` : '#ccc'
);

// RGB値の表示
const rgbDisplay = $derived(formatRgbDisplay(rgbInputs));

// RGB入力ハンドラ
function handleRgbChange(component: 'r' | 'g' | 'b', value: string) {
  const numValue = parseInt(value, 10);
  if (!Number.isNaN(numValue)) {
    rgbInputs[component] = Math.max(0, Math.min(255, numValue));
  }
  // RGB値エラーをクリア
  if (errors.rgb) {
    errors.rgb = undefined;
  }
}

// フォーム送信
async function handleSubmit() {
  if (isSubmitting) return;

  errors = {};
  isSubmitting = true;

  try {
    // 名前バリデーション
    const nameValidation = validateCustomColorName(name);
    if (!nameValidation.valid) {
      errors.name = nameValidation.error;
      return;
    }

    // RGB値バリデーション
    if (!validateRgbInput(rgbInputs)) {
      errors.rgb = $t('page.customColor.validation.rgbRange');
      return;
    }

    // 名前重複チェック
    const isDuplicate = isNameDuplicate(name.trim(), editColorId || undefined);
    if (isDuplicate) {
      errors.name = $t('page.customColor.validation.duplicateName');
      return;
    }

    // 保存処理（rgbInputsは0-255範囲）
    if (editColorId) {
      updateCustomColor(editColorId, {
        name: name.trim(),
        rgb255: rgbInputs,
      });
    } else {
      saveCustomColor({
        name: name.trim(),
        rgb: rgbInputs,
      });
    }

    onClose();
  } catch (error) {
    errors.submit = error instanceof Error ? error.message : $t('page.customColor.saveFailed');
  } finally {
    isSubmitting = false;
  }
}

function handleCancel() {
  onClose();
}
</script>

<Card.Root class="bg-muted">
  <Card.Content class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-lg font-medium">
        {editColorId ? $t('page.customColor.edit') : $t('page.customColor.add')}
      </h4>
      <Button
        variant="ghost"
        size="sm"
        onclick={handleCancel}
      >
        <X class="size-4" />
      </Button>
    </div>

    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
      <!-- 名前入力 -->
      <div class="space-y-2">
        <Label for="color-name">{$t('page.customColor.name')}</Label>
        <Input
          id="color-name"
          type="text"
          bind:value={name}
          placeholder={$t('page.customColor.namePlaceholder')}
          class={errors.name ? 'border-destructive' : ''}
          maxlength={50}
          required
        />
        {#if errors.name}
          <p class="text-xs text-destructive">{errors.name}</p>
        {/if}
      </div>

      <!-- RGB値入力 -->
      <div class="space-y-2">
        <Label>{$t('page.customColor.rgb')}</Label>
        <div class="flex gap-3">
          <div class="flex-1 space-y-1">
            <Label for="rgb-input-r" class="text-xs text-muted-foreground">R</Label>
            <Input
              id="rgb-input-r"
              type="number"
              min={0}
              max={255}
              value={rgbInputs.r}
              onchange={(e) => handleRgbChange('r', e.currentTarget.value)}
              class="h-8"
            />
          </div>
          <div class="flex-1 space-y-1">
            <Label for="rgb-input-g" class="text-xs text-muted-foreground">G</Label>
            <Input
              id="rgb-input-g"
              type="number"
              min={0}
              max={255}
              value={rgbInputs.g}
              onchange={(e) => handleRgbChange('g', e.currentTarget.value)}
              class="h-8"
            />
          </div>
          <div class="flex-1 space-y-1">
            <Label for="rgb-input-b" class="text-xs text-muted-foreground">B</Label>
            <Input
              id="rgb-input-b"
              type="number"
              min={0}
              max={255}
              value={rgbInputs.b}
              onchange={(e) => handleRgbChange('b', e.currentTarget.value)}
              class="h-8"
            />
          </div>
        </div>
        {#if errors.rgb}
          <p class="text-xs text-destructive">{errors.rgb}</p>
        {/if}
      </div>

      <!-- プレビュー -->
      <div class="space-y-2">
        <Label>{$t('page.customColor.preview')}</Label>
        <div class="flex items-center gap-3">
          <div
            class="size-12 rounded-lg border-2 border-border"
            style="background-color: {previewColor}"
          ></div>
          <div class="text-sm text-muted-foreground">
            RGB({rgbDisplay})
          </div>
        </div>
      </div>

      {#if errors.submit}
        <Alert.Root variant="destructive">
          <Alert.Description>{errors.submit}</Alert.Description>
        </Alert.Root>
      {/if}

      <!-- 操作ボタン -->
      <div class="flex gap-3 justify-end">
        <Button
          variant="ghost"
          type="button"
          onclick={handleCancel}
          disabled={isSubmitting}
        >
          {$t('page.customColor.cancel')}
        </Button>
        <Button
          type="submit"
          class="gap-2"
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <Loader2 class="size-4 animate-spin" />
          {:else}
            <Save class="size-4" />
          {/if}
          {editColorId ? $t('page.customColor.update') : $t('page.customColor.save')}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>