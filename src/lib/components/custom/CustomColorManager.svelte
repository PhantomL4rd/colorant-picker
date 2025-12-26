<script lang="ts">
import { CircleUser, Plus } from '@lucide/svelte';
import { customColorsStore } from '$lib/stores/customColors';
import { selectPrimaryDye } from '$lib/stores/selection';
import { t } from '$lib/translations';
import { createCustomDye } from '$lib/utils/color/customColorUtils';
import CustomColorForm from './CustomColorForm.svelte';
import CustomColorItem from './CustomColorItem.svelte';

let showForm = $state(false);
let editingColor = $state<string | null>(null);

const customColors = $derived($customColorsStore);

function handleAddNew() {
  editingColor = null;
  showForm = true;
}

function handleEdit(colorId: string) {
  editingColor = colorId;
  showForm = true;
}

function handleFormClose() {
  showForm = false;
  editingColor = null;
}

function handleColorSelect(color: any) {
  const customDye = createCustomDye(color);
  selectPrimaryDye(customDye);
}
</script>

<div class="space-y-4">
  {#if showForm}
    <CustomColorForm 
      editColorId={editingColor} 
      onClose={handleFormClose}
    />
  {:else}
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium flex items-center gap-2">
        <CircleUser size={20} />
        {$t('page.customColor.yourColors')}
      </h3>
      <button
        type="button"
        onclick={handleAddNew}
        class="btn btn-sm btn-primary gap-2"
      >
        <Plus size={16} />
        {$t('page.customColor.newColor')}
      </button>
    </div>

    {#if customColors.length === 0}
      <div class="text-center py-8 text-gray-500">
        <p class="mb-2">{$t('page.customColor.emptyTitle')}</p>
        <p class="text-sm">{$t('page.customColor.emptyDescription')}</p>
      </div>
    {:else}
      <div class="grid gap-3">
        {#each customColors as color (color.id)}
          <CustomColorItem 
            {color}
            onSelect={() => handleColorSelect(color)}
            onEdit={() => handleEdit(color.id)}
          />
        {/each}
      </div>
    {/if}
  {/if}
</div>