import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Button, FloatingLabel, Form, Modal, Badge } from "react-bootstrap";
import {
  stringToMicroAlgos,
  microAlgosToString,
} from "../../utils/conversions";

const UpdateGadget = ({ upGadget, gadget }) => {
  const [_name, setName] = useState(gadget.name);
  const [_image, setImage] = useState(gadget.image);
  const [_description, setDescription] = useState(gadget.description);
  const [_price, setPrice] = useState(0);

  const _appId = gadget.appId;
  const _archived = gadget.archived;
  const old_price = Math.round(parseFloat(microAlgosToString(gadget.price)));

  const isFormFilled = useCallback(() => {
    return _name && _image && _description && _price > 0;
  }, [_name, _image, _description, _price]);

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  //...

  //...
  return (
    <>
      <Button
        onClick={handleShow}
        variant="info"
        className="rounded-pill px-0"
        style={{ width: "30px" }}
      >
        <i className="bi bi-plus"></i>
      </Button>

      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Gadget</Modal.Title>
        </Modal.Header>
        <Form>
          <Modal.Body>
            <FloatingLabel
              controlId="inputName"
              label="Gadget name"
              className="mb-3"
            >
              <Form.Control
                type="text"
                value={_name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                placeholder="Enter name of gadget"
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputUrl"
              label="Image URL"
              className="mb-3"
            >
              <Form.Control
                type="text"
                value={_image}
                placeholder="Image URL"
                onChange={(e) => {
                  setImage(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputDescription"
              label="Description"
              className="mb-3"
            >
              <Form.Control
                as="textarea"
                placeholder="description"
                value={_description}
                style={{ height: "80px" }}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
              />
            </FloatingLabel>
            <FloatingLabel
              controlId="inputPrice"
              label="Price in ALGO"
              className="mb-3"
            >
              <Form.Control
                type="text"
                placeholder="Price"
                onChange={(e) => {
                  setPrice(stringToMicroAlgos(e.target.value));
                }}
              />
              <Badge bg="secondary" className="ms-auto">
                old_value === {old_price}
              </Badge>
            </FloatingLabel>
          </Modal.Body>
        </Form>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>
            Close
          </Button>
          <Button
            variant="dark"
            disabled={!isFormFilled()}
            onClick={() => {
              upGadget({
                _name,
                _image,
                _description,
                _price,
                _archived,
                _appId,
              });
              handleClose();
            }}
          >
            Update gadget
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

UpdateGadget.propTypes = {
  upGadget: PropTypes.func.isRequired,
  gadget: PropTypes.instanceOf(Object).isRequired,
};

export default UpdateGadget;
