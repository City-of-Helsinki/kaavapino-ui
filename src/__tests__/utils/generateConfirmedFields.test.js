import { describe, test, expect } from 'vitest';
import { generateConfirmedFields } from '../../utils/generateConfirmedFields';

describe('generateConfirmedFields utility function', () => {
  test('returns confirmed deadline attributes when vahvista flag is true', () => {
    const deadlines = [
      { deadline: { attribute: 'milloin_oas_esillaolo_alkaa', deadlinegroup: 'oas_esillaolokerta_1' } },
      { deadline: { attribute: 'milloin_oas_esillaolo_paattyy', deadlinegroup: 'oas_esillaolokerta_1' } }
    ];
    const attributeData = {
      vahvista_oas_esillaolo_alkaa: true,
      milloin_oas_esillaolo_alkaa: '2024-12-31',
      milloin_oas_esillaolo_paattyy: '2025-01-15'
    };
    
    const result = generateConfirmedFields(attributeData, deadlines);
    
    expect(result).toContain('milloin_oas_esillaolo_alkaa');
    expect(result).toContain('milloin_oas_esillaolo_paattyy');
  });

  test('does not return deadline attributes when vahvista flag is false', () => {
    const deadlines = [
      { deadline: { attribute: 'milloin_oas_esillaolo_alkaa', deadlinegroup: 'oas_esillaolokerta_1' } }
    ];
    const attributeData = {
      vahvista_oas_esillaolo_alkaa: false,
      milloin_oas_esillaolo_alkaa: '2024-12-31'
    };
    
    const result = generateConfirmedFields(attributeData, deadlines);
    
    expect(result).toEqual([]);
  });

  test('handles multiple deadline groups independently', () => {
    const deadlines = [
      { deadline: { attribute: 'milloin_oas_esillaolo_alkaa', deadlinegroup: 'oas_esillaolokerta_1' } },
      { deadline: { attribute: 'milloin_periaatteet_esillaolo_alkaa', deadlinegroup: 'periaatteet_esillaolokerta_1' } },
      { deadline: { attribute: 'milloin_luonnos_esillaolo_alkaa', deadlinegroup: 'luonnos_esillaolokerta_1' } }
    ];
    const attributeData = {
      vahvista_oas_esillaolo_alkaa: true,
      vahvista_periaatteet_esillaolo_alkaa: false,
      vahvista_luonnos_esillaolo_alkaa: true,
      milloin_oas_esillaolo_alkaa: '2024-12-31',
      milloin_periaatteet_esillaolo_alkaa: '2024-11-01',
      milloin_luonnos_esillaolo_alkaa: '2025-02-01'
    };
    
    const result = generateConfirmedFields(attributeData, deadlines);
    
    expect(result).toContain('milloin_oas_esillaolo_alkaa');
    expect(result).not.toContain('milloin_periaatteet_esillaolo_alkaa');
    expect(result).toContain('milloin_luonnos_esillaolo_alkaa');
  });

  test('handles indexed deadlines (_2, _3) correctly', () => {
    const deadlines = [
      { deadline: { attribute: 'milloin_oas_esillaolo_alkaa', deadlinegroup: 'oas_esillaolokerta_1' } },
      { deadline: { attribute: 'milloin_oas_esillaolo_alkaa_2', deadlinegroup: 'oas_esillaolokerta_2' } },
      { deadline: { attribute: 'milloin_oas_esillaolo_alkaa_3', deadlinegroup: 'oas_esillaolokerta_3' } }
    ];
    const attributeData = {
      vahvista_oas_esillaolo_alkaa: true,
      vahvista_oas_esillaolo_alkaa_2: false,
      vahvista_oas_esillaolo_alkaa_3: true,
      milloin_oas_esillaolo_alkaa: '2024-12-31',
      milloin_oas_esillaolo_alkaa_2: '2025-01-15',
      milloin_oas_esillaolo_alkaa_3: '2025-02-01'
    };
    
    const result = generateConfirmedFields(attributeData, deadlines);
    
    expect(result).toContain('milloin_oas_esillaolo_alkaa');
    expect(result).not.toContain('milloin_oas_esillaolo_alkaa_2');
    expect(result).toContain('milloin_oas_esillaolo_alkaa_3');
  });

  test('handles lautakunta deadlines correctly', () => {
    const deadlines = [
      { deadline: { attribute: 'milloin_periaatteet_lautakunnassa', deadlinegroup: 'periaatteet_lautakuntakerta_1' } },
      { deadline: { attribute: 'milloin_kaavaluonnos_lautakunnassa', deadlinegroup: 'luonnos_lautakuntakerta_1' } }
    ];
    const attributeData = {
      vahvista_periaatteet_lautakunnassa: true,
      vahvista_kaavaluonnos_lautakunnassa: false,
      milloin_periaatteet_lautakunnassa: '2024-12-01',
      milloin_kaavaluonnos_lautakunnassa: '2025-01-15'
    };
    
    const result = generateConfirmedFields(attributeData, deadlines);
    
    expect(result).toContain('milloin_periaatteet_lautakunnassa');
    expect(result).not.toContain('milloin_kaavaluonnos_lautakunnassa');
  });

  test('returns empty array when deadlines array is empty', () => {
    const attributeData = {
      vahvista_oas_esillaolo_alkaa: true
    };
    
    const result = generateConfirmedFields(attributeData, []);
    
    expect(result).toEqual([]);
  });

  test('skips deadlines without deadlinegroup', () => {
    const deadlines = [
      { deadline: { attribute: 'milloin_oas_esillaolo_alkaa', deadlinegroup: 'oas_esillaolokerta_1' } },
      { deadline: { attribute: 'some_other_field', deadlinegroup: null } },
      { deadline: { attribute: 'another_field' } }
    ];
    const attributeData = {
      vahvista_oas_esillaolo_alkaa: true,
      milloin_oas_esillaolo_alkaa: '2024-12-31'
    };
    
    const result = generateConfirmedFields(attributeData, deadlines);
    
    expect(result).toEqual(['milloin_oas_esillaolo_alkaa']);
  });

  test('handles ehdotus deadlines with pieni/iso variants', () => {
    const deadlines = [
      { deadline: { attribute: 'milloin_ehdotuksen_nahtavilla_alkaa_pieni', deadlinegroup: 'ehdotus_pieni_1' } },
      { deadline: { attribute: 'milloin_ehdotuksen_nahtavilla_alkaa_iso', deadlinegroup: 'ehdotus_nahtavillaolokerta_1' } }
    ];
    const attributeData = {
      vahvista_ehdotus_esillaolo_pieni: true,
      vahvista_ehdotus_esillaolo: true,
      milloin_ehdotuksen_nahtavilla_alkaa_pieni: '2024-12-31',
      milloin_ehdotuksen_nahtavilla_alkaa_iso: '2025-01-15'
    };
    
    const result = generateConfirmedFields(attributeData, deadlines);
    
    expect(result).toContain('milloin_ehdotuksen_nahtavilla_alkaa_pieni');
    expect(result).toContain('milloin_ehdotuksen_nahtavilla_alkaa_iso');
  });
});
