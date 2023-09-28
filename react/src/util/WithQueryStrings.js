import _ from 'lodash';
import queryString from 'query-string';
import React from 'react';
import { withRouter } from 'react-router';

const STANDARD_URL_DELIMITER = '_';

export const goToLocation = (newLocation, history) => {
  const locationIsExternal = newLocation.match(/^https?:\/\/.*/) !== null;

  if (locationIsExternal) {
    window.open(newLocation, '_blank');
  } else {
    history.push(newLocation);
  }
};

/**
 *
 * @param {Node} BaseComponent
 *
 * A function that returns a higher order component with query param utils
 * injected. This reduces the need to include withRouter and history/location
 * in a component's export statement if we want to work with state stored in the url.
 *
 */
const WithQueryStrings = (BaseComponent) => {
  class RouterWrapper extends React.Component {
    constructor(props) {
      super(props);

      this.getQueryParamValue = this.getQueryParamValue.bind(this);
      this.getQueryParamArrayValue = this.getQueryParamArrayValue.bind(this);
      this.setQueryParamValue = this.setQueryParamValue.bind(this);
      this.replaceQueryParamValue = this.replaceQueryParamValue.bind(this);
      this.setQueryParamObject = this.setQueryParamObject.bind(this);
      this.removeQueryKey = this.removeQueryKey.bind(this);
      this.removeQueryParamValue = this.removeQueryParamValue.bind(this);
      this.routeTo = this.routeTo.bind(this);
      this.parseString = this.parseString.bind(this);
      this.prepareQueryParamObject = this.prepareQueryParamObject.bind(this);
      this.filterDynamicQueryParam = this.filterDynamicQueryParam.bind(this);
    }

    /**
     * Retrieve a single value from url for a given  key
     *
     * @param {String} key string to query the URL for
     * @param {String} defaultValue return value if provided key not found in url
     * @param {Object} options
     */
    getQueryParamValue(key, defaultValue, options = {}) {
      const { location } = this.props;
      const { isNumeric = false, orderedKeys = null, parseJson } = options;

      const initialValue = _.get(queryString.parse(location.search), key, undefined);

      if (initialValue === undefined) {
        return defaultValue;
      }

      if (isNumeric) {
        return +initialValue;
      }

      if (orderedKeys) {
        return _.flatten([initialValue]).map((v) => {
          const split = v.split(STANDARD_URL_DELIMITER);

          if (split.length > orderedKeys.length) {
            const specified = split.slice(0, orderedKeys.length).reduce((obj, val, idx) => {
              obj[orderedKeys[idx]] = val;
              return obj;
            }, {});

            /** stuff everything beyond specified keys into `additional`, unaltered  */
            specified.additional = split.slice(orderedKeys.length).join(STANDARD_URL_DELIMITER);

            return specified;
          }

          return v.split(STANDARD_URL_DELIMITER).reduce((obj, val, idx) => {
            obj[orderedKeys[idx]] = val;
            return obj;
          }, {});
        });
      }

      return parseJson ? JSON.parse(initialValue) : initialValue;
    }

    /**
     * Wrapper around getQueryParamValue to handle multiple value associated with
     * a given url key
     *
     * @param {String} key string to query the URL for, assumes multiple values
     * @param {Array} defaultValue returned array if provided key not found
     */
    getQueryParamArrayValue(key, defaultValue, options = {}) {
      return _.flatten([this.getQueryParamValue(key, defaultValue, options)]).filter((x) => x);
    }

    /**
     * Some pages use dynamic query param keys to hold entity-specific settings,
     * ie we might want to store the well label selected for a labware id, so we'd
     * have a query param like:
     *
     *  {labware_id}-selectedWell={selected_well}
     *
     * If we deselect {labware_id} we'll want to also purge all
     * keys with that prefix from the url
     *
     */

    filterDynamicQueryParam(inputParams, keyBase) {
      const filteredParams = Object.keys(inputParams)
        .filter((f) => !f.includes(keyBase))
        .reduce((newParams, f) => {
          newParams[f] = inputParams[f];

          return newParams;
        }, {});

      return filteredParams;
    }

    /**
     * Perist a single key-value pair in the url.
     *
     * @param {String} key key to store given value
     * @param {String} value value to persist in url
     */
    setQueryParamValue(key, value, ...additionalUpdateObjs) {
      const { history, location } = this.props;

      const params = queryString.parse(location.search);

      const updateObj = {
        ...params,
        [key]: value,
      };

      if (additionalUpdateObjs) {
        additionalUpdateObjs.forEach((updatObj) => {
          const [updateKey] = Object.keys(updatObj);
          updateObj[updateKey] = updatObj[updateKey];
        });
      }

      history.push(`${location.pathname}?${queryString.stringify(updateObj)}`);
    }

    replaceQueryParamValue(key, value, options = {}) {
      const { history, location } = this.props;

      const { clearDynamicKey, encodeJson } = options;

      const params = queryString.parse(location.search);

      const updateObj = {
        ...params,
        [key]: encodeJson ? JSON.stringify(value) : value,
      };

      const effectiveUpdateObj = clearDynamicKey
        ? this.filterDynamicQueryParam(updateObj, clearDynamicKey)
        : updateObj;

      history.replace(`${location.pathname}?${queryString.stringify(effectiveUpdateObj)}`);
    }

    setQueryParamObject(newParams) {
      const { history, location } = this.props;

      const existingParams = queryString.parse(location.search);
      const newParamObj = { ...existingParams, ...newParams };

      /**
       * clean new parameter object, delete un-set keys from newParams
       */
      Object.keys(newParams).forEach((k) => {
        if (newParams[k] === undefined || newParams[k] === null || newParams[k] === '') {
          delete newParamObj[k];
        }
      });

      history.push(`${location.pathname}?${queryString.stringify(newParamObj)}`);
    }

    removeQueryKey(key) {
      const { history, location } = this.props;

      const params = queryString.parse(location.search);
      delete params[key];
      history.push(
        `${location.pathname}?${queryString.stringify({
          ...params,
        })}`,
      );
    }

    removeQueryParamValue(key, value) {
      const val = this.getQueryParamValue(key);
      if (_.isArray(val) && val.length > 1) {
        this.setQueryParamValue(
          key,
          val.filter((v) => v !== value),
        );
      } else {
        this.removeQueryKey(key);
      }
    }

    /**
     * Route to a new location in the App
     *
     * @param {String} newUrl
     */
    routeTo(newUrl) {
      const { history } = this.props;
      goToLocation(newUrl, history);
    }

    parseString(url) {
      const { location } = this.props;

      return queryString.parse(url || location.search);
    }

    /** converse of parseString */
    prepareQueryParamObject(paramObj) {
      return queryString.stringify(paramObj);
    }

    render() {
      const { location, history, match } = this.props;

      return (
        <BaseComponent
          {...this.props}
          getQueryParamValue={this.getQueryParamValue}
          getQueryParamArrayValue={this.getQueryParamArrayValue}
          setQueryParamValue={this.setQueryParamValue}
          setQueryParamObject={this.setQueryParamObject}
          removeQueryKey={this.removeQueryKey}
          removeQueryParamValue={this.removeQueryParamValue}
          replaceQueryParamValue={this.replaceQueryParamValue}
          routeTo={this.routeTo}
          parseString={this.parseString}
          location={location}
          history={history}
          match={match}
          prepareQueryParamObject={this.prepareQueryParamObject}
          filterDynamicQueryParam={this.filterDynamicQueryParam}
        />
      );
    }
  }

  return withRouter(RouterWrapper);
};

export default WithQueryStrings;
