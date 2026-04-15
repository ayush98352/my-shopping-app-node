import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'translation-cache.json');

@Injectable()
export class TranslationService implements OnModuleInit {
  private cache = new Map<string, string>();
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(private readonly httpService: HttpService) {}

  onModuleInit() {
    this.loadCache();
  }

  private loadCache() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const data: Record<string, string> = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        for (const [k, v] of Object.entries(data)) {
          this.cache.set(k, v);
        }
        console.log(`[TranslationService] Loaded ${this.cache.size} cached translations from disk`);
      }
    } catch {
      // Start with empty cache if file is missing or corrupt
    }
  }

  // Debounced write — coalesces multiple new entries into a single file write
  private scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      const obj: Record<string, string> = {};
      this.cache.forEach((v, k) => { obj[k] = v; });
      fs.writeFile(CACHE_FILE, JSON.stringify(obj), () => {});
    }, 2000);
  }

  // TRANSLATION — converts meaning (e.g. "Blue Shirt" → "नीली कमीज")
  async translate(text: string, source: string, target: string): Promise<string> {
    if (!text || source === target) return text;
    const key = `tr:${text}||${source}||${target}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    try {
      const url =
        `https://translate.googleapis.com/translate_a/single` +
        `?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await firstValueFrom(this.httpService.get(url));
      // Response: [ [ ["translatedText", "originalText", ...] ], ..., "sourceLang" ]
      const translated: string = response.data?.[0]?.[0]?.[0] ?? text;
      this.cache.set(key, translated);
      this.scheduleSave();
      return translated;
    } catch {
      return text;
    }
  }

  // TRANSLITERATION — converts phonetically (e.g. "Nike" → "नाइकी", "Zara" → "ज़ारा")
  // Uses Google Input Tools API, designed specifically for this purpose
  async transliterate(text: string, targetLang: string): Promise<string> {
    if (!text) return text;
    const key = `tl:${text}||${targetLang}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    try {
      const url =
        `https://inputtools.google.com/request` +
        `?text=${encodeURIComponent(text)}&itc=${targetLang}-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`;
      const response = await firstValueFrom(this.httpService.get(url));
      // Response: ["SUCCESS", [["originalText", ["transliterated", ...], ...]]]
      const result: string = response.data?.[1]?.[0]?.[1]?.[0] ?? text;
      this.cache.set(key, result);
      this.scheduleSave();
      return result;
    } catch {
      return text;
    }
  }

  // Apply translation to specified fields across a list of items
  async translateFields(
    items: Record<string, any>[],
    fields: string[],
    source: string,
    target: string,
  ): Promise<Record<string, any>[]> {
    if (source === target || fields.length === 0) return items;

    const unique = new Set<string>();
    for (const item of items) {
      for (const f of fields) {
        if (item[f] && typeof item[f] === 'string') unique.add(item[f]);
      }
    }

    const entries = [...unique];
    const translated = await Promise.all(
      entries.map(t => this.translate(t, source, target))
    );
    const map = new Map(entries.map((t, i) => [t, translated[i]]));

    return items.map(item => {
      const copy = { ...item };
      for (const f of fields) {
        if (copy[f] && map.has(copy[f])) copy[f] = map.get(copy[f])!;
      }
      return copy;
    });
  }

  // Apply transliteration to specified fields across a list of items
  async transliterateFields(
    items: Record<string, any>[],
    fields: string[],
    targetLang: string,
  ): Promise<Record<string, any>[]> {
    if (fields.length === 0) return items;

    const unique = new Set<string>();
    for (const item of items) {
      for (const f of fields) {
        if (item[f] && typeof item[f] === 'string') unique.add(item[f]);
      }
    }

    const entries = [...unique];
    const transliterated = await Promise.all(
      entries.map(t => this.transliterate(t, targetLang))
    );
    const map = new Map(entries.map((t, i) => [t, transliterated[i]]));

    return items.map(item => {
      const copy = { ...item };
      for (const f of fields) {
        if (copy[f] && map.has(copy[f])) copy[f] = map.get(copy[f])!;
      }
      return copy;
    });
  }

  // Pre-warm: translate uncached strings before first user requests
  async preWarm(strings: string[], source: string, target: string): Promise<void> {
    const uncached = strings.filter(s => s && !this.cache.has(`tr:${s}||${source}||${target}`));
    if (uncached.length === 0) return;

    console.log(`[TranslationService] Pre-warming ${uncached.length} translations...`);
    await Promise.all(uncached.map(s => this.translate(s, source, target)));
    console.log(`[TranslationService] Pre-warm done. Cache size: ${this.cache.size}`);
  }

  // Pre-warm: transliterate uncached strings before first user requests
  async preWarmTransliteration(strings: string[], targetLang: string): Promise<void> {
    const uncached = strings.filter(s => s && !this.cache.has(`tl:${s}||${targetLang}`));
    if (uncached.length === 0) return;

    console.log(`[TranslationService] Pre-warming ${uncached.length} transliterations...`);
    await Promise.all(uncached.map(s => this.transliterate(s, targetLang)));
    console.log(`[TranslationService] Transliteration pre-warm done. Cache size: ${this.cache.size}`);
  }
}
