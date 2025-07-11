import { slash, getMatchingStatusCodeRange, doesYamlFileExist } from '../utils.js';
import { isBrowser } from '../env.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

vi.mock('node:fs');
vi.mock('node:path');

describe('utils', () => {
  describe('slash path', () => {
    it('can correctly slash path', () => {
      [
        ['foo\\bar', 'foo/bar'],
        ['foo/bar', 'foo/bar'],
        ['foo\\中文', 'foo/中文'],
        ['foo/中文', 'foo/中文'],
      ].forEach(([path, expectRes]) => {
        expect(slash(path)).toBe(expectRes);
      });
    });

    it('does not modify extended length paths', () => {
      const extended = '\\\\?\\some\\path';
      expect(slash(extended)).toBe(extended);
    });
  });

  describe('getMatchingStatusCodeRange', () => {
    it('should get the generalized form of status codes', () => {
      expect(getMatchingStatusCodeRange('202')).toEqual('2XX');
      expect(getMatchingStatusCodeRange(400)).toEqual('4XX');
    });
    it('should fail on a wrong input', () => {
      expect(getMatchingStatusCodeRange('2002')).toEqual('2002');
      expect(getMatchingStatusCodeRange(4000)).toEqual('4000');
    });
  });

  describe('doesYamlFileExist', () => {
    beforeEach(() => {
      vi.spyOn(fs, 'existsSync').mockImplementation(
        (path) => path === 'redocly.yaml' || path === 'redocly.yml'
      );
      vi.spyOn(path, 'extname').mockImplementation((path) => {
        if (path.endsWith('.yaml')) {
          return '.yaml';
        } else if (path.endsWith('.yml')) {
          return '.yml';
        } else {
          return '';
        }
      });
    });

    it('should return true because of valid path provided', () => {
      expect(doesYamlFileExist('redocly.yaml')).toBe(true);
    });

    it('should return true because of valid path provided with yml', () => {
      expect(doesYamlFileExist('redocly.yml')).toBe(true);
    });

    it('should return false because of fail do not exist', () => {
      expect(doesYamlFileExist('redoccccly.yaml')).toBe(false);
    });

    it('should return false because of it is not yaml file', () => {
      expect(doesYamlFileExist('redocly.yam')).toBe(false);
    });
  });

  describe('isBrowser', () => {
    it('should not be browser', () => {
      expect(isBrowser).toBe(false);
    });
  });
});
