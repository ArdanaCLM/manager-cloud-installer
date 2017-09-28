import React, { Component } from 'react';
import { Alert } from 'react-bootstrap';
import { translate } from '../localization/localize.js';

class NotificationMessage extends Component {

  render() {
    let msgs = [];
    if(Array.isArray(this.props.message)) {
      this.props.message.forEach((msg, idx) => {
        msgs.push(<p key={idx}>{msg}</p>);
      });
    }
    else {
      msgs.push(<p key={0}>{this.props.message}</p>);
    }

    return (
      <div className='notification-message'>
        <Alert bsStyle={this.props.type} onDismiss={this.props.closeAction}>
          <div>
            <h4>{this.props.title}</h4>
            {msgs}
          </div>
        </Alert>
      </div>
    );
  }
}

function ErrorMessage(props) {
  return (
    <NotificationMessage
      title={props.title || translate('default.error')}
      message={props.message}
      type='danger'
      closeAction={props.closeAction}>
    </NotificationMessage>
  );
}

function SuccessMessage(props) {
  return (
    <NotificationMessage
      title={props.title || translate('default.success')}
      message={props.message}
      type='success'
      closeAction={props.closeAction}>
    </NotificationMessage>
  );
}

module.exports = {
  ErrorMessage: ErrorMessage,
  SuccessMessage: SuccessMessage
};
