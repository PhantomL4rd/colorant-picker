<script lang="ts">
import { Save, X } from '@lucide/svelte';
import {
  customColorsStore,
  isNameDuplicate,
  saveCustomColor,
  updateCustomColor,
} from '$lib/stores/customColors';
import { t } from '$lib/translations';
import type { RGBColor255 } from '$lib/types';
import { rgbToRgb255 } from '$lib/utils/colorConversion';
import {
  formatRgbDisplay,
  validateCustomColorName,
  validateRgbInput,
} from '$lib/utils/customColorUtils';

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

<div class="card bg-base-200 p-4">
  <div class="flex items-center justify-between mb-4">
    <h4 class="text-lg font-medium">
      {editColorId ? $t('page.customColor.edit') : $t('page.customColor.add')}
    </h4>
    <button
      type="button"
      onclick={handleCancel}
      class="btn btn-sm btn-ghost"
    >
      <X size={16} />
    </button>
  </div>

  <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
    <!-- 名前入力 -->
    <div class="form-control">
      <label class="label" for="color-name">
        <span class="label-text">{$t('page.customColor.name')}</span>
      </label>
      <input
        id="color-name"
        type="text"
        bind:value={name}
        placeholder={$t('page.customColor.namePlaceholder')}
        class="input input-bordered {errors.name ? 'input-error' : ''}"
        maxlength="50"
        required
      />
      {#if errors.name}
        <div class="label">
          <span class="label-text-alt text-error">{errors.name}</span>
        </div>
      {/if}
    </div>

    <!-- RGB値入力 -->
    <div class="form-control">
      <span class="label">
        <span class="label-text">{$t('page.customColor.rgb')}</span>
      </span>
      <div class="flex gap-3">
        <div class="flex-1">
          <label class="label py-1" for="rgb-input-r">
            <span class="label-text-alt">R</span>
          </label>
          <input
            id="rgb-input-r"
            type="number"
            min="0"
            max="255"
            value={rgbInputs.r}
            onchange={(e) => handleRgbChange('r', e.currentTarget.value)}
            class="input input-bordered input-sm w-full"
          />
        </div>
        <div class="flex-1">
          <label class="label py-1" for="rgb-input-g">
            <span class="label-text-alt">G</span>
          </label>
          <input
            id="rgb-input-g"
            type="number"
            min="0"
            max="255"
            value={rgbInputs.g}
            onchange={(e) => handleRgbChange('g', e.currentTarget.value)}
            class="input input-bordered input-sm w-full"
          />
        </div>
        <div class="flex-1">
          <label class="label py-1" for="rgb-input-b">
            <span class="label-text-alt">B</span>
          </label>
          <input
            id="rgb-input-b"
            type="number"
            min="0"
            max="255"
            value={rgbInputs.b}
            onchange={(e) => handleRgbChange('b', e.currentTarget.value)}
            class="input input-bordered input-sm w-full"
          />
        </div>
      </div>
      {#if errors.rgb}
        <div class="label">
          <span class="label-text-alt text-error">{errors.rgb}</span>
        </div>
      {/if}
    </div>

    <!-- プレビュー -->
    <div class="form-control">
      <span class="label">
        <span class="label-text">{$t('page.customColor.preview')}</span>
      </span>
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 rounded-lg border-2 border-base-300"
          style="background-color: {previewColor}"
        ></div>
        <div class="text-sm text-gray-600">
          RGB({rgbDisplay})
        </div>
      </div>
    </div>

    {#if errors.submit}
      <div class="alert alert-error">
        <span>{errors.submit}</span>
      </div>
    {/if}

    <!-- 操作ボタン -->
    <div class="flex gap-3 justify-end">
      <button
        type="button"
        onclick={handleCancel}
        class="btn btn-ghost"
        disabled={isSubmitting}
      >
        {$t('page.customColor.cancel')}
      </button>
      <button
        type="submit"
        class="btn btn-primary gap-2"
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          <span class="loading loading-spinner loading-xs"></span>
        {:else}
          <Save size={16} />
        {/if}
        {editColorId ? $t('page.customColor.update') : $t('page.customColor.save')}
      </button>
    </div>
  </form>
</div>