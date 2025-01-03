/*
  Copyright (c) 2017 Jeff Butsch
  Copyright © 2020 Lars Bahner <lars.bahner@gmail.com>

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Component } from 'react';
import { createBrowserHistory } from 'history';

const isNil = (value) => value == null;

const isObject = (value) => value != null && (typeof value === 'object' || typeof value === 'function');

/**
 * React Query Params Component base class
 * Support: https://github.com/jeff3dx/react-query-params
 */
export default class ReactQueryParams extends Component {
  constructor(router) {
    super();
    this.history = this.context?.router || createBrowserHistory();
    this._queryParamsCache = null;
  }

  /* Clear the query param cache */
  componentDidUpdate(prevProps, prevState) {
    this._queryParamsCache = null;
    if (super.componentDidUpdate) {
      super.componentDidUpdate(prevProps, prevState);
    }
  }

  /**
   * Convert boolean string to boolean type.
   * Any query param set to "true" or "false" will be converted to a boolean type.
   * @param {string} value - the query param string value
   */
  _boolify(value) {
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
    }
    return value;
  }

  /**
   * If query param string is object-like, try to parse it
   */
  _queryParamToObject(value) {
    if (typeof value === 'string' && (/^\[.*\]$/.test(value) || /^\{.*\}$/.test(value))) {
      try {
        return JSON.parse(decodeURIComponent(value));
      } catch (error) {
        console.error('Failed to parse JSON:', error);
      }
    }
    return value;
  }

  _resolveSearchParams(source = window) {
    const searchParams = new URLSearchParams(source.location.search || '');
    return Object.fromEntries(searchParams.entries());
  }

  /**
   * Returns a map of all query params including default values. Params that match
   * the default value do not show up in the URL but are still available here.
   */
  get queryParams() {
    if (isNil(this._queryParamsCache)) {
      const searchParams = this._resolveSearchParams();
      const defaults = this.defaultQueryParams || {};
      const allParams = { ...defaults, ...searchParams };

      Object.keys(allParams).forEach((key) => {
        allParams[key] = this._boolify(this._queryParamToObject(allParams[key]));
      });

      this._queryParamsCache = allParams;
    }
    return this._queryParamsCache;
  }

  /**
   * Get one query param value.
   * @param {string} key - The query param key
   * @param {object} source - Optional. An alternate source object to use instead of the current window object
   */
  getQueryParam(key, source = window) {
    const defaults = this.defaultQueryParams || {};
    const searchParams = this._resolveSearchParams(source);
    let result = searchParams[key] ?? defaults[key];
    return this._boolify(this._queryParamToObject(result));
  }

  /**
   * Set query param values. Merges changes similar to setState().
   * @param {object} params - Object of key:values to overlay on current query param values.
   * @param {boolean} addHistory - true = add browser history, default false.
   */
  setQueryParams(params, addHistory = false) {
    const searchParams = this._resolveSearchParams();
    const nextQueryParams = { ...searchParams, ...params };
    const defaults = this.defaultQueryParams || {};

    Object.keys(nextQueryParams).forEach((key) => {
      if (isObject(nextQueryParams[key])) {
        try {
          nextQueryParams[key] = JSON.stringify(nextQueryParams[key]);
        } catch (error) {
          console.error(`Failed to serialize queryParam ${key}:`, error);
          nextQueryParams[key] = '';
        }
      }
      if (nextQueryParams[key] === defaults[key]) {
        delete nextQueryParams[key];
      }
    });

    const search =
      '?' +
      Object.entries(nextQueryParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

    if (addHistory) {
      this.history.push({ pathname: window.location.pathname, search });
    } else {
      this.history.replace({ pathname: window.location.pathname, search });
    }

    this._queryParamsCache = null;
    this.forceUpdate();
  }
}
