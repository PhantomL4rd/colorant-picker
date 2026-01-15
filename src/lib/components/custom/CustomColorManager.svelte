<script lang="ts">
import { CircleUser, Plus } from '@lucide/svelte';
import { customColorsStore } from '$lib/stores/customColors';
import { selectPrimaryDye } from '$lib/stores/selection';
import { t } from '$lib/translations';
import { createCustomDye } from '$lib/utils/color/customColorUtils';
import { Button } from '$lib/components/ui/button';
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
        <CircleUser class="size-5" />
        {$t('page.customColor.yourColors')}
      </h3>
      <Button
        size="sm"
        class="gap-2"
        onclick={handleAddNew}
      >
        <Plus class="size-4" />
        {$t('page.customColor.newColor')}
      </Button>
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