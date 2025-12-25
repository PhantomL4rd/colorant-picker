import { writable } from 'svelte/store';
import { Dye } from '$lib/models/Dye';
import type { RawDyeDataFile } from '$lib/types';

// カララントデータストア（Dyeクラスインスタンスを保持）
export const dyeStore = writable<Dye[]>([]);

// カララントデータを読み込む
export async function loadDyes(): Promise<void> {
  try {
    // base pathを考慮してフェッチパスを動的に決定
    const basePath = import.meta.env.BASE_URL || '';
    const fetchUrl = `${basePath}data/dyes.json`;
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch dyes: ${response.status}`);
    }
    const data: RawDyeDataFile = await response.json();

    // RawDyeData → Dyeクラスインスタンスに変換
    const dyes = data.dyes.map((raw) => new Dye(raw));
    dyeStore.set(dyes);
  } catch (error) {
    console.error('Error loading dyes:', error);
    dyeStore.set([]);
  }
}
