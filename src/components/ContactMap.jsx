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

export const DEFAULT_OFFICE_ADDRESS =
  '서울 강서구 마곡중앙로 165, 805호 (프라이빗타워1차)'

const NOVA_OFFICE_FALLBACK = {
  lat: 37.5651325,
  lng: 126.8277183,
}

const MAP_ZOOM = 17
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

const MAP_VIEW_OFFSET_Y = 40

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    if (delay <= 0) {
      setDebounced(value)
      return undefined
    }

    const timeoutId = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timeoutId)
  }, [value, delay])

  return debounced
}

function getMapCenter(position) {
  const metersPerPixel =
    (156543.03392 * Math.cos((position.lat * Math.PI) / 180)) / 2 ** MAP_ZOOM
  const latOffset = (MAP_VIEW_OFFSET_Y * metersPerPixel) / 111320

  return {
    lat: position.lat + latOffset,
    lng: position.lng,
  }
}

function formatMarkerAddress(address) {
  const commaIndex = address.indexOf(',')

  if (commaIndex === -1) {
    return address
  }

  return (
    <>
      {address.slice(0, commaIndex + 1)}
      <br />
      {address.slice(commaIndex + 1).trim()}
    </>
  )
}

function MapLocationMarker({ address }) {
  return (
    <div className="contact-map-marker">
      <div className="contact-map-label" role="note" aria-label="노바피프티 위치">
        <strong>노바피프티 | NOVAFIFTY</strong>
        <span>{formatMarkerAddress(address)}</span>
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

function MapMarkerLayer({ address, displayAddress }) {
  const map = useMap()
  const geocoding = useMapsLibrary('geocoding')
  const [position, setPosition] = useState(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!geocoding) {
      return undefined
    }

    const geocodeTarget = address?.trim() || DEFAULT_OFFICE_ADDRESS
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    const geocoder = new geocoding.Geocoder()

    geocoder.geocode({ address: geocodeTarget }, (results, status) => {
      if (requestIdRef.current !== requestId) {
        return
      }

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

    return undefined
  }, [address, geocoding, map])

  if (!position) {
    return null
  }

  return (
    <AdvancedMarker position={position} anchorPoint={AdvancedMarkerAnchorPoint.BOTTOM}>
      <MapLocationMarker address={displayAddress?.trim() || DEFAULT_OFFICE_ADDRESS} />
    </AdvancedMarker>
  )
}

export default function ContactMap({
  address = DEFAULT_OFFICE_ADDRESS,
  className = '',
  geocodeDebounceMs = 0,
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const trimmedAddress = address?.trim() || DEFAULT_OFFICE_ADDRESS
  const geocodeAddress = useDebouncedValue(trimmedAddress, geocodeDebounceMs)
  const mapClassName = ['contact-map', className].filter(Boolean).join(' ')

  if (!apiKey) {
    return (
      <img
        className={['contact-map-fallback', className].filter(Boolean).join(' ')}
        src={mapPlaceholder}
        alt="NOVA50 location map placeholder"
      />
    )
  }

  return (
    <APIProvider apiKey={apiKey} language="ko" region="KR">
      <Map
        className={mapClassName}
        mapId={MAP_ID}
        defaultCenter={NOVA_OFFICE_FALLBACK}
        defaultZoom={MAP_ZOOM}
        gestureHandling="cooperative"
        disableDefaultUI={false}
        clickableIcons={false}
      >
        <MapMarkerLayer address={geocodeAddress} displayAddress={trimmedAddress} />
      </Map>
    </APIProvider>
  )
}
