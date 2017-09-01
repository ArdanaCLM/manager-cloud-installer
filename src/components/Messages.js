import React, { Component } from 'react';
import { Alert } from 'react-bootstrap';
import '../Deployer.css';
import { translate } from '../localization/localize.js';

class NotificationMessage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: this.props.show,
      //format for {title: atitle,  messages: ['message1', 'message2']}
      content: this.initContent()
    };
    this.handleDismiss = this.handleDismiss.bind(this);
  }

  initContent() {
    let retContent = {};
    if(this.props.show) {
      if (this.props.content.title) {
        retContent.title = this.props.content.title;
      }
      else {
        retContent.title = translate('default.error');
      }
    }

    return retContent;
  }

  handleDismiss() {
    if(this.props.closeAction) {
      this.props.closeAction();
    }
    else {
      this.setState({
        show: false,
        content: undefined
      });
    }
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      show: newProps.show,
      content: newProps.content
    });
  }

  renderMessageContent() {
    let msgs = [];
    if(Array.isArray(this.state.content.messages)) {
      this.state.content.messages.forEach((msg, idx) => {
        msgs.push(<p key={idx}>{msg}</p>);
      });
    }
    else {
      msgs.push(<p key={0}>{this.state.content.messages}</p>);
    }

    return (
      <div>
        <h4>{this.state.content.title}</h4>
        {msgs}
      </div>
    );
  }

  render() {
    if (this.state.show) {
      return (
        <div className='notification-message'>
          <Alert bsStyle={this.props.type} onDismiss={this.handleDismiss}>
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
        show={this.state.show}  content={this.props.content}
        type='danger' closeAction={this.props.closeAction}>
      </NotificationMessage>
    );
  }
}

module.exports = {
  ErrorMessage: ErrorMessage
};
