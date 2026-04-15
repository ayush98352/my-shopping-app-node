import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TranslationService } from '../modules/home/translation.service';

// Proper nouns — phonetically convert to Hindi script (transliteration)
const TRANSLITERATE_FIELDS = [
  'brand_name',
  'name',         // store / mall names
];

// Descriptive text — convert meaning to Hindi (translation)
const TRANSLATE_FIELDS = [
  'product_name',
  'product_short_name',
  'category_name',
  'top_category_name',
  'ideal_for',
  'description',
  'product_description',
  'care_instructions',
  'complete_the_look',
  'size_fit',
  'dominant_material',
  'instore_offers',
];

// Quick check: does this result actually contain any fields we care about?
// Avoids spinning up translation tasks for responses like cart updates, auth, etc.
function hasAnyTargetField(items: Record<string, any>[]): boolean {
  if (items.length === 0) return false;
  const first = items[0];
  return (
    TRANSLATE_FIELDS.some(f => first[f] != null) ||
    TRANSLITERATE_FIELDS.some(f => first[f] != null)
  );
}

@Injectable()
export class TranslateResponseInterceptor implements NestInterceptor {
  constructor(private readonly translationService: TranslationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const lang = ((request.headers['accept-language'] as string) ?? 'en')
      .toLowerCase()
      .trim();

    return next.handle().pipe(
      switchMap(async (response) => {
        if (lang !== 'hi' || !response?.result) return response;

        const isArray = Array.isArray(response.result);
        const items: Record<string, any>[] = isArray ? response.result : [response.result];

        // Skip translation entirely if no relevant fields are present
        if (!hasAnyTargetField(items)) return response;

        // Determine which field groups are actually present (avoid no-op calls)
        const first = items[0];
        const translateFields = TRANSLATE_FIELDS.filter(f => first[f] != null);
        const transliterateFields = TRANSLITERATE_FIELDS.filter(f => first[f] != null);

        // Run translation and transliteration in parallel
        const [translated, transliterated] = await Promise.all([
          translateFields.length > 0
            ? this.translationService.translateFields(items, translateFields, 'en', 'hi')
            : Promise.resolve(items),
          transliterateFields.length > 0
            ? this.translationService.transliterateFields(items, transliterateFields, 'hi')
            : Promise.resolve(items),
        ]);

        // Merge: translated fields base + transliterated fields overlay
        const merged = translated.map((item, i) => {
          if (transliterateFields.length === 0) return item;
          return {
            ...item,
            ...Object.fromEntries(
              transliterateFields.map(f => [f, transliterated[i][f]])
            ),
          };
        });

        const result = isArray ? merged : merged[0];
        return { ...response, result };
      }),
    );
  }
}
