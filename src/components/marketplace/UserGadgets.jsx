import PropTypes from "prop-types";
import { Button, Card, Col, Stack, Badge } from "react-bootstrap";
import { microAlgosToString, truncateAddress } from "../../utils/conversions";
import Identicon from "../utils/Identicon";

const UserGadgets = ({ address, gadget, deleteGadget }) => {
  const { name, image, description, price, appId, owner } = gadget;

  return (
    <Col key={appId}>
      <Card className="bg-dark text-white">
        <Card.Header>
          <Stack direction="horizontal" gap={2}>
            <span className="font-monospace text-secondary">
              {truncateAddress(owner)}
            </span>
            <Identicon size={28} address={address} />
            <Badge bg="secondary" className="ms-auto">
              got for {microAlgosToString(price)}ALGOs
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
          <Button
            variant="outline-danger"
            onClick={() => deleteGadget(gadget)}
            className="btn"
          >
            <i className="bi bi-trash"></i>
          </Button>
          <Card.Text className="flex-grow-1"> </Card.Text>
        </Card.Body>
      </Card>
    </Col>
  );
};

UserGadgets.propTypes = {
  address: PropTypes.string.isRequired,
  gadget: PropTypes.instanceOf(Object).isRequired,
  deleteGadget: PropTypes.func.isRequired,
};

export default UserGadgets;
