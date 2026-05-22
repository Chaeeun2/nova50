import { useEffect, useRef, useState } from 'react'
import {
  APIProvider,
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  Map,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'
import mapPlaceholder from '../assets/contact/map_placeholder.jpg'
import './ContactMap.css'

const OFFICE_ADDRESS = '서울 강서구 마곡중앙로 165, 805호 (프라이빗타워1차)'

// 지오코딩 실패 시 사용 (마곡중앙로 165, 프라이빗타워1차)
const NOVA_OFFICE_FALLBACK = {
  lat: 37.5651325,
  lng: 126.8277183,
}

const MAP_ZOOM = 17
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

// 마커를 화면에서 조금 아래로 보이게 할 때 값 조정 (px, 클수록 더 아래)
const MAP_VIEW_OFFSET_Y = 40

function getMapCenter(position) {
  const metersPerPixel =
    (156543.03392 * Math.cos((position.lat * Math.PI) / 180)) / 2 ** MAP_ZOOM
  const latOffset = (MAP_VIEW_OFFSET_Y * metersPerPixel) / 111320

  return {
    lat: position.lat + latOffset,
    lng: position.lng,
  }
}

function MapLocationMarker() {
  return (
    <div className="contact-map-marker">
      <div className="contact-map-label" role="note" aria-label="노바피프티 위치">
        <strong>노바피프티 | NOVAFIFTY</strong>
        <span>서울 강서구 마곡중앙로 165,<br/>805호 (프라이빗타워1차)</span>
      </div>
      <svg
        className="contact-map-pin"
        width="28"
        height="40"
        viewBox="0 0 28 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z"
          fill="#EA4335"
        />
        <circle cx="14" cy="14" r="6" fill="#fff" />
      </svg>
    </div>
  )
}

function MapMarkerLayer() {
  const map = useMap()
  const geocoding = useMapsLibrary('geocoding')
  const [position, setPosition] = useState(null)
  const geocodedRef = useRef(false)

  useEffect(() => {
    if (!geocoding || geocodedRef.current) return
    geocodedRef.current = true

    const geocoder = new geocoding.Geocoder()

    geocoder.geocode({ address: OFFICE_ADDRESS }, (results, status) => {
      const nextPosition =
        status === 'OK' && results?.[0]
          ? {
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng(),
            }
          : NOVA_OFFICE_FALLBACK

      setPosition(nextPosition)
      map?.setCenter(getMapCenter(nextPosition))
      map?.setZoom(MAP_ZOOM)
    })
  }, [geocoding, map])

  if (!position) return null

  return (
    <AdvancedMarker position={position} anchorPoint={AdvancedMarkerAnchorPoint.BOTTOM}>
      <MapLocationMarker />
    </AdvancedMarker>
  )
}

function ContactMap() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <img
        className="contact-map-fallback"
        src={mapPlaceholder}
        alt="NOVA50 location map placeholder"
      />
    )
  }

  return (
    <APIProvider apiKey={apiKey} language="ko" region="KR">
      <Map
        className="contact-map"
        mapId={MAP_ID}
        defaultCenter={NOVA_OFFICE_FALLBACK}
        defaultZoom={MAP_ZOOM}
        gestureHandling="cooperative"
        disableDefaultUI={false}
        clickableIcons={false}
      >
        <MapMarkerLayer />
      </Map>
    </APIProvider>
  )
}

export default ContactMap
