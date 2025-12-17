import { describe, it, expect, vi } from 'vitest'
import L from 'leaflet'
import {

helsinkiCenter,
EPSG3879,
formatGeoJSONToPositions,
formatPositionsToGeoJSON
} from '../../utils/mapUtils'

describe('mapUtils', () => {

    describe('EPSG3879', () => {
        it('should return a Leaflet CRS object', () => {
            const crs = EPSG3879()
            expect(crs).toBeDefined()
            expect(crs).toBeInstanceOf(L.Proj.CRS)
        });
    });

    describe('formatGeoJSONToPositions', () => {
        it('should return empty array for undefined input', () => {
            expect(formatGeoJSONToPositions(undefined)).toEqual([[]])
        })

        it('should format single polygon', () => {
            const geoJSON = [[[1, 2], [3, 4], [5, 6]]]
            const result = formatGeoJSONToPositions(geoJSON)
            expect(result).toEqual([[[1, 2], [3, 4], [5, 6]]])
        })
        it('should format multiple polygons', () => {
            const geoJSON = [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]
            const result = formatGeoJSONToPositions(geoJSON)
            expect(result).toEqual([[[1, 2], [3, 4]], [[5, 6], [7, 8]]])
        })
        it('should handle null polygons in array', () => {
            const geoJSON = [[null, [1, 2]]]
            const result = formatGeoJSONToPositions(geoJSON)
            expect(result).toEqual([[null, [1, 2]]])
        })
    })

    describe('formatPositionsToGeoJSON', () => {
        it('should return empty MultiPolygon for empty positions', () => {
            const result = formatPositionsToGeoJSON([])
            expect(result).toEqual({
                type: 'MultiPolygon',
                coordinates: []
            })
        })

        it('should format single polygon with lat/lng objects', () => {
            const positions = [[
                { lat: 60.1, lng: 24.9 },
                { lat: 60.2, lng: 24.8 },
                { lat: 60.3, lng: 24.7 }
            ]]
            const result = formatPositionsToGeoJSON(positions)
            expect(result.type).toBe('MultiPolygon')
            expect(result.coordinates).toHaveLength(1)
            expect(result.coordinates[0][0]).toEqual([
                [60.1, 24.9],
                [60.2, 24.8],
                [60.3, 24.7],
                [60.1, 24.9]
            ])
        })

        it('should close polygon by adding first point at end', () => {
            const positions = [[
                { lat: 1, lng: 2 },
                { lat: 3, lng: 4 }
            ]]
            const result = formatPositionsToGeoJSON(positions)
            const coords = result.coordinates[0][0]
            expect(coords[0]).toEqual(coords[coords.length - 1])
        })

        it('should handle empty polygon', () => {
            const positions = [[]]
            const result = formatPositionsToGeoJSON(positions)
            expect(result.coordinates).toEqual([[]])
        })

        it('should format multiple polygons', () => {
            const positions = [
                [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }],
                [{ lat: 5, lng: 6 }, { lat: 7, lng: 8 }]
            ]
            const result = formatPositionsToGeoJSON(positions)
            expect(result.coordinates).toHaveLength(2)
        })
    })
})