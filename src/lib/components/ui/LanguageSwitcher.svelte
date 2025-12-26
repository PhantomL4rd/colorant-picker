<script lang="ts">
import { Globe } from 'lucide-svelte';
import {
  locale,
  setLocale,
  SUPPORTED_LOCALES,
  LOCALE_NAMES,
  t,
  type Locale,
} from '$lib/translations';

const currentLocale = $derived($locale as Locale);

async function handleLocaleChange(newLocale: Locale) {
  await setLocale(newLocale);
  // ドロップダウンを閉じる
  (document.activeElement as HTMLElement)?.blur();
}
</script>

<div class="dropdown dropdown-end">
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div tabindex="0" role="button" class="btn btn-ghost btn-circle" aria-label={$t('common.aria.languageSwitch')}>
    <Globe class="w-5 h-5" />
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <ul
    tabindex="0"
    class="dropdown-content menu bg-base-200 text-base-content rounded-box z-10 w-36 p-2 shadow mt-2"
  >
    {#each SUPPORTED_LOCALES as loc}
      <li>
        <button
          type="button"
          class="flex items-center gap-2"
          class:active={currentLocale === loc}
          onclick={() => handleLocaleChange(loc)}
        >
          {LOCALE_NAMES[loc]}
        </button>
      </li>
    {/each}
  </ul>
</div>
