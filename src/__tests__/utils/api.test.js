import { pingApi, documentsApi, projectApi, phaseApi } from '../../utils/api.js';
import { describe, test, expect } from 'vitest';

describe('Api url formatting',() => {
    test('Without parameters', () => {
        const api = pingApi;
        const result_url = api.formatUrl({}, {}, '');
        expect(result_url).toBe("/v1/ping/");
    });

    test('With path variables', () => {
        const doc_api = documentsApi;
        const result_url = doc_api.formatUrl({id: 123}, {}, '');
        expect(result_url).toBe('/v1/projects/123/documents/');
    });

    test ('With query parameters', () => {
        const project_api = projectApi;
        const result_url = project_api.formatUrl({}, {order: 'asc', pinonumero: 999, special:'& ?*'}, '');
        expect(result_url).toBe('/v1/projects/?order=asc&pinonumero=999&special=%26%20%3F*');
    });

    test ('With path and query parameters', () => {
        const phase_api = phaseApi;
        const result_url = phase_api.formatUrl(
            {id: 123, kokoluokka: 'XL'},
            {order: 'asc', pinonumero: 999, special:'& ?*'},
            ':id/:kokoluokka');
        expect(result_url).toBe('/v1/phases/123/XL?order=asc&pinonumero=999&special=%26%20%3F*');
    });
});
