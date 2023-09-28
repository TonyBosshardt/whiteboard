import _ from 'lodash';
import React from 'react';

const WithLocalStorage = (WrappedComponent) => {
  class LocalStorageInjector extends React.Component {
    constructor(props) {
      super(props);

      this.storeValue = this.storeValue.bind(this);
      this.getValue = this.getValue.bind(this);
    }

    getValue(key, options = {}) {
      const { defaultValue = null, isNumeric = false, filterExpiry = false } = options;

      const item =
        localStorage.getItem(key) || (defaultValue ? JSON.stringify(defaultValue) : null);

      if (filterExpiry) {
        const parsedItem = JSON.parse(item);

        if (_.isArray(parsedItem)) {
          const now = new Date();

          const filtered = parsedItem.filter((a) => now.getTime() < a.expiry);

          this.storeValue(key, filtered);

          return filtered;
        }

        return parsedItem;
      }

      if (isNumeric) {
        return +item;
      }

      return JSON.parse(item);
    }

    storeValue(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }

    render() {
      return (
        <WrappedComponent
          setLocalValue={this.storeValue}
          getLocalValue={this.getValue}
          {...this.props}
        />
      );
    }
  }

  return LocalStorageInjector;
};

export default WithLocalStorage;
