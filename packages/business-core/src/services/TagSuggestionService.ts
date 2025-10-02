/**
 * TagSuggestionService
 * Simple heuristic-based tag suggestions for photos
 */

export interface TagContext {
  taskName?: string;
  taskCategory?: string;
  space?: { name?: string; floor?: number; category?: string } | null;
  buildingName?: string;
}

export class TagSuggestionService {
  private static COMMON = [
    'sidewalk',
    'lobby',
    'elevator',
    'roof',
    'trash area',
    'bathroom',
    'laundry area',
    'boiler room',
    'electrical room',
    'storage room',
    'supplies',
    'workshop',
    'stairwell',
    'basement',
    'backyard',
    'roof drains',
    'backyard drains',
  ];
  static normalize(s?: string): string | undefined {
    if (!s) return undefined;
    const n = s.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    return n || undefined;
  }

  static getSuggestions(ctx: TagContext): string[] {
    const set = new Set<string>();
    // Base
    set.add('camera');
    // From task
    const t = this.normalize(ctx.taskName);
    if (t) set.add(t);
    const cat = this.normalize(ctx.taskCategory);
    if (cat) set.add(cat);
    // From space
    const spaceName = this.normalize(ctx.space?.name);
    if (spaceName) set.add(spaceName);
    if (ctx.space?.floor !== undefined) set.add(`floor_${ctx.space.floor}`);
    const spaceCat = this.normalize(ctx.space?.category);
    if (spaceCat) set.add(spaceCat);
    // From building
    const building = this.normalize(ctx.buildingName);
    if (building) set.add(building);
    return Array.from(set);
  }

  static getCommonTags(): string[] {
    const out = new Set<string>();
    this.COMMON.forEach((t) => {
      const n = this.normalize(t);
      if (n) out.add(n);
    });
    return Array.from(out);
  }
}

export default TagSuggestionService;
