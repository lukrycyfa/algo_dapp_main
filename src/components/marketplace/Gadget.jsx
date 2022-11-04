import React, { useState } from "react";
import PropTypes from "prop-types";
import UpdateGadget from "./UpdateGadget";
import {
  Badge,
  Button,
  Card,
  Col,
  FloatingLabel,
  Form,
  Stack,
} from "react-bootstrap";
import { microAlgosToString, truncateAddress } from "../../utils/conversions";
import Identicon from "../utils/Identicon";

// update here
const Gadget = ({
  address,
  gadget,
  buyGadget,
  deleteGadget,
  updateGadget,
  archiveGadget,
  unarchiveGadget,
}) => {
  const { name, image, description, price, archived, sold, appId, owner } =
    gadget;

  const [count, setCount] = useState(1);

  return (
    <Col key={appId}>
      <Card className="bg-dark text-white">
        <Card.Header>
          <Stack direction="horizontal" gap={2}>
            <span className="font-monospace text-secondary">
              {truncateAddress(owner)}
            </span>
            <Identicon size={28} address={owner} />
            {owner === address && (
              <UpdateGadget upGadget={updateGadget} gadget={gadget} />
            )}
            <Badge bg="secondary" className="ms-auto">
              {sold} Sold
            </Badge>
          </Stack>
        </Card.Header>
        <div className="ratio ratio-4x3">
          <img src={image} alt={name} style={{ objectFit: "cover" }} />
        </div>
        <Card.Body className="d-flex flex-column text-center">
          <Card.Title>{name}</Card.Title>
          <Card.Text className="flex-grow-1">{description}</Card.Text>
          {/* updated here */}
          {archived === 0 && owner === address && (
            <Button
              onClick={() => archiveGadget(gadget)}
              variant="outline-info"
            >
              Archive Gadget {archived}
              <i className="bi bi-minus"></i>
            </Button>
          )}
          {archived === 1 && owner === address && (
            <Button
              onClick={() => unarchiveGadget(gadget)}
              variant="outline-warning"
            >
              Unarchive Gadget {archived}
              <i className="bi bi-plus"></i>
            </Button>
          )}
          <Card.Text className="flex-grow-1"> </Card.Text>
          {/* updated here */}
          <Form className="d-flex align-content-stretch flex-row gap-2">
            <FloatingLabel
              controlId="inputCount"
              label="Count"
              className="w-25"
            >
              <Form.Control
                type="number"
                variant="outline-info"
                value={count}
                min="1"
                max="10"
                onChange={(e) => {
                  setCount(Number(e.target.value));
                }}
              />
            </FloatingLabel>
            <Button
              variant="outline-info"
              onClick={() => buyGadget(gadget, count)}
              className="w-75 py-3"
            >
              Buy for {microAlgosToString(price) * count} ALGO
            </Button>
            {gadget.owner === address && (
              <Button
                variant="outline-danger"
                onClick={() => deleteGadget(gadget)}
                className="btn"
              >
                <i className="bi bi-trash"></i>
              </Button>
            )}
          </Form>
        </Card.Body>
      </Card>
    </Col>
  );
};

Gadget.propTypes = {
  address: PropTypes.string.isRequired,
  gadget: PropTypes.instanceOf(Object).isRequired,
  buyGadget: PropTypes.func.isRequired,
  deleteGadget: PropTypes.func.isRequired,
  updateGadget: PropTypes.func.isRequired,
  archiveGadget: PropTypes.func.isRequired,
  unarchiveGadget: PropTypes.func.isRequired,
};

export default Gadget;
