import React, { Component } from 'react';
import { Alert } from 'react-bootstrap';
import '../Deployer.css';

class NotificationMessage extends Component {
  constructor(props) {
    super(props);
  }

  renderMessageContent() {
    //content format for {title: atitle,  messages: ['message1', 'message2']}
    let msgs = [];
    if(Array.isArray(this.props.content.messages)) {
      this.props.content.messages.forEach((msg, idx) => {
        msgs.push(<p key={idx}>{msg}</p>);
      });
    }
    else {
      msgs.push(<p key={0}>{this.props.content.messages}</p>);
    }

    return (
      <div>
        <h4>{this.props.content.title}</h4>
        {msgs}
      </div>
    );
  }

  render() {
    if (this.props.show) {
      return (
        <div className='notification-message'>
          <Alert bsStyle={this.props.type} onDismiss={this.props.closeAction}>
            {this.renderMessageContent()}
          </Alert>
        </div>
      );
    }
    else {
      return <div></div>;
    }
  }
}

class ErrorMessage extends NotificationMessage {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <NotificationMessage
        show={this.props.show}  content={this.props.content}
        type='danger' closeAction={this.props.closeAction}>
      </NotificationMessage>
    );
  }
}

module.exports = {
  ErrorMessage: ErrorMessage
};
