# Fix: Editor Choppy Typing Due to Draft Sync Race Condition

## Problem

When typing in the editor, content deletes itself or re-adds itself causing choppy, error-prone typing. This is caused by a race condition between local state updates and React Query cache invalidations.

### Race Condition Sequence

1. User types → `setContent()` updates local state
2. 400ms debounce fires → `upsertDraft.mutate()` saves to server
3. Mutation `onSuccess` → `invalidateQueries()` triggers refetch
4. Refetch returns draft → cache updated with new object reference
5. Sync effect detects `draft` changed → calls `setContent(draft.content)`
6. User's recent keystrokes overwritten with stale server data

### Key Files

- `prose/app/workspace/[workspaceId]/document/[documentId]/page.tsx` - sync effect, debounce
- `prose/hooks/use-documents.ts` - mutation hooks with cache invalidation

## Solution

Stop updating the React Query cache on draft mutations. Let the cache be stale during editing - the server has the source of truth, and fresh data loads on next navigation/refresh.

### Changes

#### 1. Remove `onSuccess` from `useUpsertDocumentDraft`

**File:** `prose/hooks/use-documents.ts`

```tsx
export function useUpsertDocumentDraft(workspaceId: string | null | undefined) {
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data } = await axios.put<DocumentDraft>(
        `/api/workspace/${workspaceId}/documents/${id}/draft`,
        { content }
      );
      return data;
    },
    // No onSuccess - don't touch cache during editing
  });
}
```

#### 2. Remove `onSuccess` from `useDeleteDocumentDraft`

**File:** `prose/hooks/use-documents.ts`

```tsx
export function useDeleteDocumentDraft(workspaceId: string | null | undefined) {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await axios.delete(`/api/workspace/${workspaceId}/documents/${id}/draft`);
    },
    // No onSuccess - don't touch cache during editing
  });
}
```

#### 3. Increase debounce to 1000ms

**File:** `prose/app/workspace/[workspaceId]/document/[documentId]/page.tsx`

Change line 66 from `}, 400);` to `}, 1000);`

## Why This Works

- **During editing:** Local state is the source of truth. Mutations save to server but don't update cache. No refetch, no overwrite.
- **On navigation/refresh:** React Query fetches fresh data from server, cache is repopulated, sync effect loads correct content.
- **Stale cache is fine:** We only read from cache on initial load. After that, we're writing to server and trusting local state.

## Testing

1. Open a document in the editor
2. Type rapidly for several seconds - verify no choppy behavior or content loss
3. Pause for 1+ second, verify draft saves (check Network tab)
4. Refresh page - verify draft content persists
5. Edit content back to match base document, wait - verify draft is deleted
6. Refresh - verify base document content shows
