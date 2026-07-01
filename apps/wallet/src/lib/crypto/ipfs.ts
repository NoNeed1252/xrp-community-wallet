/**
 * Resolves an IPFS URI into a public gateway URL.
 * Supports ipfs:// protocol and handles fallbacks.
 */
export function resolveIpfsUrl(uri: string | null | undefined): string {
  if (!uri) return '/placeholders/nft-placeholder.png'; // Fallback to local placeholder
  
  // Replace ipfs:// with a public gateway
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }

  // Handle cases where the CID is provided without protocol
  if (uri.match(/^[a-zA-Z0-9]{46,59}$/)) {
    return `https://ipfs.io/ipfs/${uri}`;
  }

  return uri;
}
