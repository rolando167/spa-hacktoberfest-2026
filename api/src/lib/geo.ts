import type { Coordinates } from "../types/point-of-interest.js";

const earthRadiusM = 6_371_000;

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function distanceInMeters(from: Coordinates, to: Coordinates): number {
  const latitudeDelta = degreesToRadians(to.lat - from.lat);
  const longitudeDelta = degreesToRadians(to.lon - from.lon);
  const fromLatitude = degreesToRadians(from.lat);
  const toLatitude = degreesToRadians(to.lat);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return Math.round(earthRadiusM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
}
