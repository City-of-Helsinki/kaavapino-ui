import { describe, test, expect } from 'vitest';
import {
  getFieldsetDisplayOrder,
  applyRequestedOrder,
  moveFieldsetRow,
  getFieldsetOrderChanges,
} from '../../../components/input/FieldSet/helpers.js';

describe('getFieldsetDisplayOrder', () => {
  test.each([
    ['empty or missing values', undefined, 0, []],
    ['legacy rows without _order keep array order', [{}, {}, {}], 3, [0, 1, 2]],
    ['rows follow _order rather than array index', [{ _order: 2 }, { _order: 0 }, { _order: 1 }], 3, [1, 2, 0]],
    ['row added after a reorder (no _order) is last', [{ _order: 1 }, { _order: 0 }, {}], 3, [1, 0, 2]],
    ['tombstone without _order does not displace ordered rows', [{ _order: 1 }, { _deleted: true }, { _order: 0 }], 3, [2, 0, 1]],
    ['invalid _order values fall back to index', [{ _order: '2' }, { _order: null }, { _order: NaN }], 3, [0, 1, 2]],
    ['ties are broken by array index', [{ _order: 1 }, {}, { _order: 1 }], 3, [0, 1, 2]],
    // redux-form may report more rows than values right after sets.push({})
    ['length beyond values treats missing rows as unordered', [{ _order: 1 }, { _order: 0 }], 3, [1, 0, 2]],
  ])('%s', (_, values, length, expected) => {
    expect(getFieldsetDisplayOrder(values, length)).toEqual(expected);
  });
});

describe('applyRequestedOrder', () => {
  test('puts requested indices first and keeps the rest in display order', () => {
    expect(applyRequestedOrder([0, 1, 2, 3], [2, 0])).toEqual([2, 0, 1, 3]);
  });

  test('ignores requested indices that no longer exist', () => {
    expect(applyRequestedOrder([0, 2], [3, 2, 1, 0])).toEqual([2, 0]);
  });

  test('without a request returns display order unchanged', () => {
    expect(applyRequestedOrder([1, 0])).toEqual([1, 0]);
  });
});

describe('moveFieldsetRow', () => {
  test.each([
    ['moves down', [5, 6, 7], 0, 2, [6, 7, 5]],
    ['moves up', [5, 6, 7], 2, 0, [7, 5, 6]],
  ])('%s', (_, order, from, to, expected) => {
    expect(moveFieldsetRow(order, from, to)).toEqual(expected);
  });

  test.each([
    ['same position', 1, 1],
    ['from out of range', -1, 0],
    ['to out of range', 0, 3],
  ])('returns the same array for %s', (_, from, to) => {
    const order = [5, 6, 7];
    expect(moveFieldsetRow(order, from, to)).toBe(order);
  });
});

describe('getFieldsetOrderChanges', () => {
  test('assigns contiguous _order values to non-deleted rows and skips tombstones', () => {
    const values = [{ a: 1 }, { a: null, _deleted: true }, { a: 3 }, { a: 4 }];
    expect(getFieldsetOrderChanges(values, [3, 0, 2])).toEqual([
      { index: 3, order: 0 },
      { index: 0, order: 1 },
      { index: 2, order: 2 },
    ]);
  });

  test('assigned orders stay below the array length so newly added rows sort last', () => {
    const values = [{}, { _deleted: true }, { _deleted: true }, {}];
    const changes = getFieldsetOrderChanges(values, [3, 0]);
    const reordered = values.map((v, i) => {
      const change = changes.find(c => c.index === i);
      return change ? { ...v, _order: change.order } : v;
    });
    reordered.push({});
    expect(getFieldsetDisplayOrder(reordered).filter(i => !reordered[i]._deleted)).toEqual([3, 0, 4]);
  });

  test('returns only rows whose _order actually changes', () => {
    const values = [{ _order: 0 }, { _order: 1 }, { _order: 2 }];
    expect(getFieldsetOrderChanges(values, [0, 2, 1])).toEqual([
      { index: 2, order: 1 },
      { index: 1, order: 2 },
    ]);
    expect(getFieldsetOrderChanges(values, [0, 1, 2])).toEqual([]);
  });

  test('rows deleted meanwhile are dropped and rows added meanwhile are appended', () => {
    // User requested [2, 1, 0] based on stale data; row 1 has since been deleted and row 3 added
    const latest = [{}, { _deleted: true }, {}, {}];
    expect(getFieldsetOrderChanges(latest, [2, 1, 0])).toEqual([
      { index: 2, order: 0 },
      { index: 0, order: 1 },
      { index: 3, order: 2 },
    ]);
  });

  test.each([[undefined], [null], [{}]])('returns no changes for non-array values (%s)', (values) => {
    expect(getFieldsetOrderChanges(values, [0])).toEqual([]);
  });
});
