import L from 'leaflet'
import 'proj4'
import 'proj4leaflet'

export const helsinkiCenter = [60.192059, 24.945831]

export const EPSG3879 = () => {
  const crsName = 'EPSG:3879'
  const projDef =
    '+proj=tmerc +lat_0=0 +lon_0=25 +k=1 +x_0=25500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
  const boundPoints = [
    [24451424, 6291456],
    [26548576, 8388608]
  ]
  const resolutions = [
    8192,
    4096,
    2048,
    1024,
    512,
    256,
    128,
    64,
    32,
    16,
    8,
    4,
    2,
    1,
    0.5,
    0.25,
    0.125,
    0.0625
  ]
  const origin = [24451424, 8388608]
  const bounds = L.bounds(L.point(boundPoints[0]), L.point(boundPoints[1]))

  const crsOpts = {
    origin,
    resolutions,
    bounds,
    transformation: new L.Transformation(1, -bounds.min.x, -1, bounds.max.y)
  }
  return new L.Proj.CRS(crsName, projDef, crsOpts)
}

export const formatGeoJSONToPositions = geoJSON => {
  const result = []
  if (!geoJSON) {
    return [[]]
  }
  if (geoJSON.length > 1) {
    geoJSON.forEach(current => {
      const multi = []
      current.forEach(polygon => {
        multi.push(polygon ? polygon : [])
      })
      result.push(multi)
    })
  } else {
    geoJSON.forEach(polygon => {
      result.push(polygon ? polygon : [])
    })
  }
  return result
}

export const formatPositionsToGeoJSON = positions => {
  const result = []
  positions.forEach((polygon, i) => {
    result.push([])
    if (polygon.length > 0) {
      let updatedPolygon = polygon.concat(polygon[0])
      result[i].push(updatedPolygon.map(({ lat, lng }) => [lat, lng]))
    }
  })
  return {
    type: 'MultiPolygon',
    coordinates: result
  }
}
