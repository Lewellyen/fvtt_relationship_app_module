/**
 * Version detection for Foundry VTT.
 * Extracts the major version number from Foundry's version string.
 */

/**
 * Gets the major version number of the currently running Foundry VTT instance.
 * @returns The major version number (e.g., 13 for "13.348")
 * @throws Error if game is not available or version cannot be determined
 */
export function getFoundryVersion(): number {
  if (typeof game === "undefined") {
    throw new Error("Foundry game object is not available or version cannot be determined");
  }

  // game.version is typed as string by fvtt-types
  // Format is "{major}.{minor}" (e.g., "13.348")
  const versionString = game.version;
  if (!versionString) {
    throw new Error("Foundry version is not available on the game object");
  }
  const match = versionString.match(/^(\d+)/);

  if (!match) {
    throw new Error(`Could not parse Foundry version from: ${versionString}`);
  }

  return Number.parseInt(match[1]!, 10);
}

/**
 * Safely gets the Foundry version, returning undefined if it cannot be determined.
 * @returns The major version number or undefined if not available
 */
export function tryGetFoundryVersion(): number | undefined {
  try {
    return getFoundryVersion();
  } catch {
    return undefined;
  }
}
