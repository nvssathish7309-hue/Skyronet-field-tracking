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
 * Minimum real movement required between two GPS pings to count as distance.
 * GPS satellites have natural drift of 3–15 meters even when stationary.
 * Any movement below this threshold is treated as GPS noise and ignored.
 * 10 meters = 0.010 km — below this, the engineer is considered stationary.
 */
const MIN_MOVEMENT_METERS = 10; // meters
const MIN_MOVEMENT_KM = MIN_MOVEMENT_METERS / 1000;

/**
 * Validates whether a new GPS point is valid or should be filtered out.
 * Rejects points with:
 *  - Poor accuracy (> maxAccuracyMeters)
 *  - Unrealistic speed jumps (> 150 km/h)
 *  - Movement below MIN_MOVEMENT_METERS (GPS drift / stationary noise)
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

  // ── Stationary / GPS-drift filter ──────────────────────────────────────────
  // If the calculated distance is less than MIN_MOVEMENT_METERS, the engineer
  // hasn't physically moved — this is GPS satellite noise. Reject the point so
  // no phantom distance is added to the trip.
  if (distKm < MIN_MOVEMENT_KM) {
    return {
      valid: false,
      reason: `Movement ${Math.round(distKm * 1000)}m below minimum threshold ${MIN_MOVEMENT_METERS}m — stationary noise filtered`,
      distanceKm: 0
    };
  }
  // ───────────────────────────────────────────────────────────────────────────

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

