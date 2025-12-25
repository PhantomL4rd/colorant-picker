<script lang="ts">
  import { Globe } from 'lucide-svelte';
  import type { Locale } from '$lib/types';
  import { localeStore, setLocale } from '$lib/stores/locale';
  import { LOCALE_NAMES, SUPPORTED_LOCALES } from '$lib/utils/i18n';

  const currentLocale = $derived($localeStore);

  async function handleLocaleChange(locale: Locale) {
    await setLocale(locale);
  }
</script>

<div class="dropdown dropdown-end">
  <button type="button" class="btn btn-ghost btn-circle" aria-label="言語切替">
    <Globe class="w-5 h-5" />
  </button>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <ul
    tabindex="0"
    class="dropdown-content menu bg-base-200 text-base-content rounded-box z-10 w-36 p-2 shadow mt-2"
  >
    {#each SUPPORTED_LOCALES as locale}
      <li>
        <button
          type="button"
          class="flex items-center gap-2"
          class:active={currentLocale === locale}
          onclick={() => handleLocaleChange(locale)}
        >
          {LOCALE_NAMES[locale]}
        </button>
      </li>
    {/each}
  </ul>
</div>
