import React from 'react';

const WithLocalStorage = (WrappedComponent) => {
  class LocalStorageInjector extends React.Component {
    constructor(props) {
      super(props);

      this.storeValue = this.storeValue.bind(this);
      this.getValue = this.getValue.bind(this);
    }

    getValue(key, options = {}) {
      const { defaultValue = null, isNumeric = false } = options;

      const item =
        localStorage.getItem(key) || (defaultValue ? JSON.stringify(defaultValue) : null);

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
