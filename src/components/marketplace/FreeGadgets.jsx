import React from "react";
import PropTypes from "prop-types";
import { Badge, Button, Card, Col, Form, Stack } from "react-bootstrap";
import { microAlgosToString, truncateAddress } from "../../utils/conversions";
import Identicon from "../utils/Identicon";

// update here
const FreeGadget = ({ address, gadget, createFreeGadget }) => {
  const { name, image, description, price, sold, appId, owner } = gadget;

  const user_note = new TextEncoder().encode(
    `${address.slice(0, 4)}-${address.slice(54)}:new_user`
  );

  return (
    <Col key={appId}>
      <Card className="bg-dark text-white">
        <Card.Header>
          <Stack direction="horizontal" gap={2}>
            <span className="font-monospace text-secondary">
              {truncateAddress(owner)}
            </span>
            <Identicon size={28} address={owner} />
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
          <Card.Text className="flex-grow-1">gadget price: {microAlgosToString(price)} </Card.Text>
          {/* updated here */}
          <Form className="d-flex align-content-stretch flex-row gap-2">
            <Button
              variant="outline-info"
              onClick={() => createFreeGadget(address, gadget, user_note)}
              className="w-75 py-3"
            >
              Buy for 0.0003 ALGO
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Col>
  );
};

FreeGadget.propTypes = {
  address: PropTypes.string.isRequired,
  gadget: PropTypes.instanceOf(Object).isRequired,
  createFreeGadget: PropTypes.func.isRequired,
};

export default FreeGadget;
