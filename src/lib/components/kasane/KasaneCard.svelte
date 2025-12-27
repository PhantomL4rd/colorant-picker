<script lang="ts">
  import { t } from '$lib/translations';
  import type { DyeProps } from '$lib/types';

  interface Props {
    name: string;
    reading: string;
    omoteDye: DyeProps | null;
    uraDye: DyeProps | null;
  }

  const { name, reading, omoteDye, uraDye }: Props = $props();

  const omoteHex = $derived(omoteDye?.hex ?? '#808080');
  const uraHex = $derived(uraDye?.hex ?? '#808080');
  const omoteName = $derived(
    omoteDye ? $t(`dye.names.${omoteDye.id}`) || omoteDye.name : 'Unknown'
  );
  const uraName = $derived(uraDye ? $t(`dye.names.${uraDye.id}`) || uraDye.name : 'Unknown');
</script>

<div
  class="card bg-base-100 shadow-sm border border-base-300"
  aria-label="{name}（{reading}）: {$t('page.kasane.label.omote')} {omoteName}, {$t('page.kasane.label.ura')} {uraName}"
>
  <div class="card-body p-3">
    <div class="text-center mb-2">
      <h3 class="font-bold text-base">{name}</h3>
      <p class="text-xs text-base-content/60">{reading}</p>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div class="text-center">
        <div
          class="w-full h-12 rounded-lg border-2 border-base-300"
          style="background-color: {omoteHex};"
          title={omoteName}
        ></div>
        <div class="text-xs mt-1 text-base-content/60 truncate" title={omoteName}>
          {omoteName}
        </div>
      </div>

      <div class="text-center">
        <div
          class="w-full h-12 rounded-lg border-2 border-base-300"
          style="background-color: {uraHex};"
          title={uraName}
        ></div>
        <div class="text-xs mt-1 text-base-content/60 truncate" title={uraName}>
          {uraName}
        </div>
      </div>
    </div>
  </div>
</div>
