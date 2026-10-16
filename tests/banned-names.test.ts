import { describe, expect, it } from 'vitest';
import { bannedNameProblems } from '../src/core/bannedNames';

const banned = ['Hàn Lập', 'Thanh Vân Môn'];
const pool = { surnames: ['Hàn', 'Lý'], male: ['Thanh Phong'], female: [], maleMiddle: ['Văn'], maleGiven: ['Lập'], femaleMiddle: [], femaleGiven: [] };

describe('banned names (9.R7a)', () => {
  it('flags exact use in any case, and the same name with only tone marks changed', () => {
    expect(bannedNameProblems({ 'a.json': [{ text: 'Đệ tử thanh vân môn tới.' }] }, banned)).toHaveLength(1);
    expect(bannedNameProblems({ 'a.json': { name: 'Hán Lập' } }, banned)[0].message).toContain('quá giống');
  });

  it('leaves ordinary words alone', () => {
    expect(bannedNameProblems({ 'a.json': ['hàn lắp cửa', 'trời thanh vân nhẹ', 'Hàn Lập Tân'.slice(0, 3)] }, banned)).toEqual([]);
    expect(bannedNameProblems({ 'a.json': ['Thanh Vân Môntag'] }, banned)).toEqual([]);
  });

  it('a name pool that can put a banned name together is an error', () => {
    expect(bannedNameProblems({ 'worlds/x/character/names.json': pool }, banned)).toEqual([]);
    const bad = { ...pool, male: ['Lập'] };
    expect(bannedNameProblems({ 'worlds/x/character/names.json': bad }, banned)[0].message).toContain('kho tên');
  });
});
