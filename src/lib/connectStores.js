import React, {Component} from 'react';

export default function connectStores(stores, getState, ChildComponent) {
  return class extends Component {
    constructor(props) {
      super(props);
      stores.forEach(store => store.addChangeListener(this.handleStoreChanges));
      this.state = getState(props);
    }

    componentWillUnmount() {
      stores.forEach(store => store.removeChangeListener(this.handleStoreChanges));
    }

    handleStoreChanges = () => {
      this.setState(() => getState(this.props));
    };

    render() {
      return <ChildComponent {...this.props} {...this.state} />;
    }
  };
}
