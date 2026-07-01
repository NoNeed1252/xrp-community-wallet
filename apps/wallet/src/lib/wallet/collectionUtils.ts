import { Buffer } from 'buffer';

/**
 * Decodes a Hex string to UTF-8. 
 * Essential for XRP Ledger metadata which is often Hex-encoded.
 */
function decodeHexName(hex: string): string {
  try {
    return Buffer.from(hex, 'hex').toString('utf8');
  } catch {
    return hex; // Return raw hex if decoding fails
  }
}

/**
 * Formats the collection display name.
 * Handles: Raw object string, Hex encoding, and missing names.
 */
export function getCollectionDisplayName(collection: any): string {
  if (!collection) return "Unknown Collection";

  // 1. Check for 'name' property
  let name = collection.name || collection.collection_name;

  // 2. If name is hex-encoded (common in XRPL), decode it
  if (name && /^[0-9A-Fa-f]+$/.test(name)) {
    name = decodeHexName(name);
  }

  // 3. Fallback to Taxon/ID if name is still missing
  if (!name && collection.nft_taxon !== undefined) {
    return `Collection #${collection.nft_taxon}`;
  }

  return name || "Unknown Collection";
}
