import React, {useCallback, useState} from "react";
import PropTypes from "prop-types";
import {Button, FloatingLabel, Form, Modal} from "react-bootstrap";
import {stringToMicroAlgos} from "../../utils/conversions";

const AddGadget = ({createGadget}) => {
    const [name, setName] = useState("");
    const [image, setImage] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState(0);

    const isFormFilled = useCallback(() => {
        return name && image && description && price > 0
    }, [name, image, description, price]);

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
//...

//...
return (
    <>
        <Button
            onClick={handleShow}
            variant="success"
            className="rounded-pill px-0"
            style={{width: "38px"}}
        >
            <i className="bi bi-plus"></i>
        </Button>
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>New Gadget</Modal.Title>
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
                            onChange={(e) => {
                                setName(e.target.value);
                            }}
                            placeholder="Enter name of Gadget"
                        />
                    </FloatingLabel>
                    <FloatingLabel
                        controlId="inputUrl"
                        label="Image URL"
                        className="mb-3"
                    >
                        <Form.Control
                            type="text"
                            placeholder="Image URL"
                            value={image}
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
                        createGadget({
                            name,
                            image,
                            description,
                            price
                        });
                        handleClose();
                    }}
                >
                    Save Gadget
                </Button>
            </Modal.Footer>
        </Modal>
    </>
);
};

AddGadget.propTypes = {
createGadget: PropTypes.func.isRequired,
};

export default AddGadget;