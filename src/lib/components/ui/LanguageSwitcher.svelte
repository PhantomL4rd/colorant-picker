<script lang="ts">
import { Globe } from '@lucide/svelte';
import { Button } from '#lib/components/ui/button/index.js';
import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
import {
  LOCALE_NAMES,
  type Locale,
  locale,
  SUPPORTED_LOCALES,
  setLocale,
  t,
} from '#lib/translations/index.js';

const currentLocale = $derived($locale as Locale);

async function handleLocaleChange(newLocale: Locale) {
  await setLocale(newLocale);
}
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="icon" aria-label={$t('common.aria.languageSwitch')}>
        <Globe class="size-5" />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-36">
    {#each SUPPORTED_LOCALES as loc}
      <DropdownMenu.Item
        class={currentLocale === loc ? 'bg-accent' : ''}
        onSelect={() => handleLocaleChange(loc)}
      >
        {LOCALE_NAMES[loc]}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
