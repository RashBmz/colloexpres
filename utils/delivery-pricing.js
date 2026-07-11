const DEFAULT_DELIVERY_FEE = 200;
const OUTSIDE_FIRST_ZONE_DELIVERY_FEE = 200;

// Premier palier Collo visible sur la capture fournie.
// Les points sont volontairement configurés dans un seul fichier pour pouvoir ajuster
// la zone facilement quand tu me donnes les prochains paliers.
const COLLO_100_DA_ZONE = [
  [37.01398323120405, 6.5634306124845],
  [37.01339728915065, 6.559929540748797],
  [37.0109823930534, 6.555235396869135],
  [37.01218206885298, 6.548881754268132],
  [37.01133237787541, 6.545568325939922],
  [37.00944919118277, 6.546016684898341],
  [37.00683178627582, 6.547805513844212],
  [37.00442446258474, 6.547997056517493],
  [37.00298751584351, 6.548433899719067],
  [36.99888156540337, 6.550813123125856],
  [36.99853094508599, 6.555240975836902],
  [37.00210968889652, 6.565310606430758],
  [37.00180051866595, 6.57411800476678],
  [37.01514985575171, 6.582897064159409],
];

function toCoord(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizePoint(lat, lng) {
  const safeLat = toCoord(lat);
  const safeLng = toCoord(lng);
  if (safeLat == null || safeLng == null) return null;
  return { lat: safeLat, lng: safeLng };
}

function pointInPolygon(point, polygon) {
  if (!point || !Array.isArray(polygon) || polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const yi = Number(polygon[i][0]);
    const xi = Number(polygon[i][1]);
    const yj = Number(polygon[j][0]);
    const xj = Number(polygon[j][1]);
    const intersects = ((yi > point.lat) !== (yj > point.lat))
      && (point.lng < ((xj - xi) * (point.lat - yi)) / ((yj - yi) || 1e-12) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function calculateDeliveryFee({ toLat, toLng } = {}) {
  const to = normalizePoint(toLat, toLng);

  if (!to) {
    return { fee: OUTSIDE_FIRST_ZONE_DELIVERY_FEE, tier: 'collo_200', reason: 'missing_destination' };
  }

  const toInFirstZone = pointInPolygon(to, COLLO_100_DA_ZONE);

  if (toInFirstZone) {
    return { fee: 100, tier: 'collo_100', reason: 'inside_first_zone' };
  }

  return { fee: OUTSIDE_FIRST_ZONE_DELIVERY_FEE, tier: 'collo_200', reason: 'outside_first_zone' };
}

function getPublicDeliveryPricing() {
  return {
    defaultFee: OUTSIDE_FIRST_ZONE_DELIVERY_FEE,
    zones: [
      {
        id: 'collo_100',
        label: 'Palier Collo',
        fee: 100,
        polygon: COLLO_100_DA_ZONE,
      },
    ],
    outsideFirstZoneFee: OUTSIDE_FIRST_ZONE_DELIVERY_FEE,
  };
}

module.exports = {
  calculateDeliveryFee,
  getPublicDeliveryPricing,
  pointInPolygon,
};
