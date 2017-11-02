// (c) Copyright 2017 SUSE LLC
/**
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/
import React from 'react';
import { Modal } from 'react-bootstrap';
import { ActionButton } from '../components/Buttons.js';
import { translate } from '../localization/localize.js';
import '../Deployer.css';

function ConfirmModal(props) {
  return (
    <Modal
      className='modals'
      show={props.show}
      onHide={props.onHide}
      backdrop={'static'}
      dialogClassName={props.className}>

      <Modal.Header closeButton>
        <Modal.Title className='title'>{props.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {props.children}
      </Modal.Body>
      <Modal.Footer>
        {props.footer ||
          <ActionButton clickAction={props.onHide} displayLabel={translate('ok')}/>}
      </Modal.Footer>
    </Modal>
  );
}

function YesNoModal(props) {
  const footer = (
    <div className="btn-row">
      <ActionButton type='default' clickAction={props.noAction} displayLabel={translate('no')}/>
      <ActionButton clickAction={props.yesAction} displayLabel={translate('yes')}/>
    </div>
  );

  return (
    <ConfirmModal show={props.show} title={props.title} onHide={props.noAction} footer={footer}>
      {props.children}
    </ConfirmModal>
  );
}

function BaseInputModal(props) {

  //won't render footer, but implement footers in the body
  //to have control over the input contents changes.
  return (
    <Modal
      className='modals'
      show={props.show}
      onHide={props.onHide}
      backdrop={'static'}
      dialogClassName={props.className}>

      <Modal.Header closeButton>
        <Modal.Title className='title'>{props.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {props.children}
      </Modal.Body>
    </Modal>
  );
}

export { ConfirmModal, YesNoModal, BaseInputModal };
