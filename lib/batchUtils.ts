/**
 * Cortex High-Performance Batch & Compression Utility
 *
 * 1. Bulk Batched Operations: Replaces sequential individual INSERT/UPDATE loops with multi-row batched writes.
 * 2. Transaction Chunking: Automatically chunks large batches (default 500 items) to prevent statement overflow or lock contention.
 * 3. Compression Helpers: Configures client & edge compression headers (Accept-Encoding: gzip, deflate, br).
 */

import { supabase } from './supabase';

const DEFAULT_BATCH_CHUNK_SIZE = 500;
const COMPRESSION_MIN_BYTES_THRESHOLD = 1024; // 1KB minimum threshold for edge compression

/**
 * Bulk Insert: Executes multi-row batched inserts in chunks within single operations.
 */
export async function bulkInsert<T extends Record<string, any>>(
  tableName: string,
  records: T[],
  chunkSize: number = DEFAULT_BATCH_CHUNK_SIZE
): Promise<{ success: boolean; insertedCount: number; error?: any }> {
  if (!records || records.length === 0) {
    return { success: true, insertedCount: 0 };
  }

  let totalInserted = 0;

  // Chunk large arrays into manageable batch sizes to prevent long table locks
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);

    const { data, error } = await supabase
      .from(tableName)
      .insert(chunk);

    if (error) {
      console.error(`[BulkInsert Error] Batch chunk failed on ${tableName}:`, error);
      return { success: false, insertedCount: totalInserted, error };
    }

    totalInserted += chunk.length;
  }

  return { success: true, insertedCount: totalInserted };
}

/**
 * Bulk Upsert / Batch Update: Performs batched multi-row upserts in chunked transactions.
 */
export async function bulkUpsert<T extends Record<string, any>>(
  tableName: string,
  records: T[],
  onConflictKey?: string,
  chunkSize: number = DEFAULT_BATCH_CHUNK_SIZE
): Promise<{ success: boolean; updatedCount: number; error?: any }> {
  if (!records || records.length === 0) {
    return { success: true, updatedCount: 0 };
  }

  let totalUpdated = 0;

  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);

    const { data, error } = await supabase
      .from(tableName)
      .upsert(chunk, onConflictKey ? { onConflict: onConflictKey } : undefined);

    if (error) {
      console.error(`[BulkUpsert Error] Batch chunk failed on ${tableName}:`, error);
      return { success: false, updatedCount: totalUpdated, error };
    }

    totalUpdated += chunk.length;
  }

  return { success: true, updatedCount: totalUpdated };
}

/**
 * Edge & Client HTTP Compression Header Helper
 */
export const COMPRESSION_HEADERS = {
  'Accept-Encoding': 'gzip, deflate, br',
  'Vary': 'Accept-Encoding',
};

/**
 * Determines whether a payload should be compressed in transit on Edge Server.
 */
export function shouldCompressResponse(
  content: string,
  contentType: string
): boolean {
  // Avoid double-compressing binary or already compressed media payloads
  if (
    contentType.includes('image/') ||
    contentType.includes('video/') ||
    contentType.includes('audio/') ||
    contentType.includes('zip') ||
    contentType.includes('gzip') ||
    contentType.includes('br')
  ) {
    return false;
  }

  const byteLength = new TextEncoder().encode(content).length;
  return byteLength >= COMPRESSION_MIN_BYTES_THRESHOLD;
}
