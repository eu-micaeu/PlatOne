const STEAM_ARTWORK_BASE_URL = 'https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps';

export function resolvePreferredGameArtwork(
  platform: string,
  externalId: string | undefined,
  image: string | undefined
): string | undefined {
  if (platform.toLowerCase() !== 'steam') {
    return image;
  }

  return createSteamHeroArtwork(externalId) ?? upgradeSteamCommunityIcon(image) ?? image;
}

export function createSteamHeroArtwork(appId: string | undefined): string | null {
  const normalizedAppId = appId?.trim() ?? '';
  if (!/^\d+$/.test(normalizedAppId)) {
    return null;
  }

  return `${STEAM_ARTWORK_BASE_URL}/${normalizedAppId}/library_hero.jpg`;
}

export function createSteamCapsuleArtwork(appId: string | undefined): string | null {
  const normalizedAppId = appId?.trim() ?? '';
  if (!/^\d+$/.test(normalizedAppId)) {
    return null;
  }

  return `${STEAM_ARTWORK_BASE_URL}/${normalizedAppId}/capsule_616x353.jpg`;
}

function upgradeSteamCommunityIcon(image: string | undefined): string | undefined {
  if (!image) {
    return undefined;
  }

  const match = image.match(/\/apps\/(\d+)\/[^/]+\.jpg(?:\?.*)?$/i);
  return match ? createSteamCapsuleArtwork(match[1]) ?? image : image;
}