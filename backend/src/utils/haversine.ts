/**
 * Haversine formula to calculate the distance between two GPS coordinates in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Validates whether a new GPS point is valid or should be filtered out.
 * Rejects points with poor accuracy (> 50m) or unrealistic speed jumps (> 150 km/h).
 */
export function isValidGPSPoint(
  prevLat: number,
  prevLon: number,
  prevTime: Date,
  newLat: number,
  newLon: number,
  newTime: Date,
  accuracy: number,
  maxAccuracyMeters: number = 50
): { valid: boolean; reason?: string; distanceKm: number } {
  // Accuracy check
  if (accuracy > maxAccuracyMeters) {
    return { valid: false, reason: `Accuracy ${accuracy}m exceeds limit ${maxAccuracyMeters}m`, distanceKm: 0 };
  }

  const distKm = calculateHaversineDistance(prevLat, prevLon, newLat, newLon);

  // Time diff in hours
  const timeDiffHours = (new Date(newTime).getTime() - new Date(prevTime).getTime()) / (1000 * 60 * 60);

  if (timeDiffHours <= 0) {
    return { valid: false, reason: 'Time difference non-positive', distanceKm: 0 };
  }

  const impliedSpeedKmH = distKm / timeDiffHours;

  // Jump check: > 150 km/h is unrealistic for bike field work
  if (impliedSpeedKmH > 150) {
    return {
      valid: false,
      reason: `Unrealistic speed jump: ${Math.round(impliedSpeedKmH)} km/h`,
      distanceKm: 0
    };
  }

  return { valid: true, distanceKm: distKm };
}
