/**
 * Approximate centroids for common Seoul dongs.
 * Used to geocode MOLIT transaction records which only carry a dong name.
 *
 * For a production deployment that covers all 400+ Seoul dongs, replace this
 * with a Kakao/Naver geocoding API call (both have generous free tiers and
 * explicitly permit this use case in their ToS).
 */
export const DONG_COORDS: Record<string, { lat: number; lng: number }> = {
  // 마포구
  합정동: { lat: 37.5495, lng: 126.9140 },
  연남동: { lat: 37.5620, lng: 126.9224 },
  망원동: { lat: 37.5556, lng: 126.9050 },
  상수동: { lat: 37.5480, lng: 126.9230 },
  서교동: { lat: 37.5535, lng: 126.9220 },
  공덕동: { lat: 37.5434, lng: 126.9502 },
  마포동: { lat: 37.5380, lng: 126.9469 },
  용강동: { lat: 37.5408, lng: 126.9361 },
  // 성동구
  성수동: { lat: 37.5447, lng: 127.0560 },
  왕십리동: { lat: 37.5618, lng: 127.0396 },
  마장동: { lat: 37.5640, lng: 127.0455 },
  행당동: { lat: 37.5591, lng: 127.0322 },
  금호동: { lat: 37.5501, lng: 127.0132 },
  // 강남구
  역삼동: { lat: 37.4999, lng: 127.0369 },
  삼성동: { lat: 37.5140, lng: 127.0569 },
  논현동: { lat: 37.5119, lng: 127.0249 },
  청담동: { lat: 37.5248, lng: 127.0516 },
  대치동: { lat: 37.4943, lng: 127.0620 },
  신사동: { lat: 37.5186, lng: 127.0200 },
  압구정동: { lat: 37.5275, lng: 127.0282 },
  개포동: { lat: 37.4810, lng: 127.0469 },
  // 서초구
  서초동: { lat: 37.4836, lng: 127.0325 },
  방배동: { lat: 37.4815, lng: 126.9924 },
  반포동: { lat: 37.5036, lng: 126.9984 },
  잠원동: { lat: 37.5118, lng: 127.0000 },
  // 용산구
  이태원동: { lat: 37.5348, lng: 126.9944 },
  한남동: { lat: 37.5343, lng: 127.0004 },
  용산동: { lat: 37.5321, lng: 126.9653 },
  후암동: { lat: 37.5461, lng: 126.9756 },
  // 영등포구
  여의도동: { lat: 37.5213, lng: 126.9238 },
  영등포동: { lat: 37.5261, lng: 126.9064 },
  당산동: { lat: 37.5335, lng: 126.9011 },
  // 송파구
  잠실동: { lat: 37.5133, lng: 127.1000 },
  송파동: { lat: 37.5020, lng: 127.1074 },
  방이동: { lat: 37.5121, lng: 127.1200 },
  문정동: { lat: 37.4886, lng: 127.1245 },
  가락동: { lat: 37.4935, lng: 127.1167 },
}

export function getDongCoords(dong: string): { lat: number; lng: number } | null {
  if (DONG_COORDS[dong]) return DONG_COORDS[dong]
  // Partial match: "성수동1가" → "성수동"
  for (const [key, coords] of Object.entries(DONG_COORDS)) {
    if (dong.startsWith(key)) return coords
  }
  return null
}
