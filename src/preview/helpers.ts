import type { AureliaStoryResult } from './types';

export function defineAureliaStory<TArgs = Record<string, unknown>>(
  story: AureliaStoryResult<TArgs>
): AureliaStoryResult<TArgs> {
  return story;
}
