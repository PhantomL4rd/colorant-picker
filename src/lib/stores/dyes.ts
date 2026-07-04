import { get, writable } from 'svelte/store';
import { Dye } from '$lib/models/Dye';
import type { RawDyeDataFile } from '$lib/types';

// カララントデータストア（Dyeクラスインスタンスを保持）
export const dyeStore = writable<Dye[]>([]);

// カララントデータを読み込む。
// 成功時 true / 失敗時 false を返す（呼び出し元が失敗を検知できるように）。
// 失敗しても既ロード済みのデータは保持し、一時的な fetch 失敗で画面が空白になるのを防ぐ。
export async function loadDyes(): Promise<boolean> {
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
    return true;
  } catch (error) {
    console.error('Error loading dyes:', error);
    // 既にデータがある場合は保持（一時的な失敗で既存データを消さない）。
    // 未ロードのまま失敗した場合のみ空のまま。
    return get(dyeStore).length > 0;
  }
}
