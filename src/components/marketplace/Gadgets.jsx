import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AddGadget from "./AddGadget";
import UserGadgets from "./UserGadgets.jsx";
import FreeGadgets from "./FreeGadgets.jsx";  
import Gadget from "./Gadget";
import Loader from "../utils/Loader";
import { NotificationError, NotificationSuccess } from "../utils/Notifications";
import {
  buyGadgetAction,
  createGadgetAction,
  deleteGadgetAction,
  getGadgetsAction,
  updateGadgetAction,
  FreeBieEligibility,
  getUserGadgetAction,
  archiveAction,
  unarchiveAction,
} from "../../utils/gadgetmarket";
import PropTypes from "prop-types";
import { Row } from "react-bootstrap";

const Gadgets = ({ address, fetchBalance, refresh }) => {
  const [gadgets, setGadgets] = useState([]);
  const [archivedgads, setArchivedGads] = useState([]);
  const [usergads, SetUsersGads] = useState([]);
  const [owngad, setOwngad] = useState("");
  const [loading, setLoading] = useState(false);
  const [freegads, setFreeGads] = useState([]);
  const [freebies, setFreeBies] = useState(false);

  // get dapp_gadgets(archived, unarchived, freebies) 
  const getGadgets = async () => {
    setLoading(true);
    getGadgetsAction(address)
      .then((allgadgets) => {
        if (allgadgets) {
          if (allgadgets[0].length >= 1) {
            setGadgets(allgadgets[0]);

          } 
          if (allgadgets[1].length >= 1) {
            setArchivedGads(allgadgets[1]);
            setOwngad(address);

          }
         if (allgadgets[2].length >= 1){
            setFreeGads(allgadgets[2]);

          }  
        }
      })

      .catch((error) => {
        console.log(error);
      })
      .finally((_) => {
        setLoading(false);
      });
  };
  useEffect(() => {
    getGadgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  //...

  // get  users gadgets and check freebie eligibility.
 const getUserGadgets = async () => {
    setLoading(true);
     getUserGadgetAction(address)
       .then((UserGadgets) => {
            SetUsersGads(UserGadgets);
            FreeBieEligibility(address).then((discount) => {
                    if (discount === true) {
                      setFreeBies(true);
                      toast(
                        <NotificationSuccess text="You Have a freebie." />
                      );
                    } else if (discount === false) {
                      toast(
                        <NotificationSuccess text="You have no freebie." />
                      );
                    }
                  });
              })   
      .catch((error) => {
        console.log(error);
      })
      .finally((_) => {
        setLoading(false);
      });
  };
  useEffect(() => {
    getUserGadgets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // create Gadgets
  const createGadget = async (data) => {
    setLoading(true);
    createGadgetAction(address, data)
      .then(() => {
        toast(<NotificationSuccess text="Gadget added successfully." />);
        refresh();
        fetchBalance(address);
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to create a gadget Your window might be blocking a pop up.." />);
        setLoading(false);
      });
  };
  //...
 
 // create a freebie gadget 
 const createFreeGadget = async (address, data, user_note) => {
    setLoading(true);
    createGadgetAction(address, data, user_note)
      .then(() => {
        toast(<NotificationSuccess text="Gadget added successfully." />);
        refresh();
        fetchBalance(address);
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to create a gadget. Your window might be blocking a pop up." />);
        setLoading(false);
      });
  };
  //...
  
  // buy gadgets
  const buyGadget = async (gadget, count) => {
    setLoading(true);
    buyGadgetAction(address, gadget, count)
      .then(() => {
        toast(<NotificationSuccess text="Gadget bought successfully" />);
        refresh();
        fetchBalance(address);
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to purchase aadget. Your window might be blocking a pop up." />);
        setLoading(false);
      });
  };
  //...

  //...
  //.. delete gadgets
  const deleteGadget = async (gadget) => {
    setLoading(true);
    deleteGadgetAction(address, gadget.appId)
      .then(() => {
        toast(<NotificationSuccess text="gadget deleted successfully" />);
        refresh();
        fetchBalance(address);
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to delete gadget. Your window might be blocking a pop up." />);
        setLoading(false);
      });
  };
  //...

  // update gadgets
  const updateGadget = async (data) => {
    setLoading(true);
    updateGadgetAction(address, data)
      .then(() => {
        toast(<NotificationSuccess text="Gadget updated successfully." />);
        refresh();
        fetchBalance(address);
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to update Gadget. Your window might be blocking a pop up." />);
        setLoading(false);
      });
  };
  //...

  // archive gadget
  const archiveGadget = async (gadget) => {
    setLoading(true);
    archiveAction(address, gadget.appId)
      .then(() => {
        toast(<NotificationSuccess text="Gadget updated successfully." />);
        refresh();
        fetchBalance(address);
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to update Gadget. Your window might be blocking a pop up." />);
        setLoading(false);
      });
  };
  //...

  // unarchive gadget
  const unarchiveGadget = async (gadget) => {
    setLoading(true);
    unarchiveAction(address, gadget.appId)
      .then(() => {
        toast(<NotificationSuccess text="Gadget updated successfully." />);
        refresh();
        fetchBalance(address);
      })
      .catch((error) => {
        console.log(error);
        toast(<NotificationError text="Failed to update Gadget. Your window might be blocking a pop up." />);
        setLoading(false);
      });
  };
  //...
  if (loading) {
    return <Loader />;
  }
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-8">
        <h1 className="fs-6 fw-bold mb-0">Tech Market Gadgets</h1>
        {/* uncomment to restrcit creation of application to dapp owner or First app user */}
        {/* {appowner && ( */}
        <AddGadget createGadget={createGadget} />
        {/* )} */}
      </div>
      <Row xs={1} sm={2} lg={3} className="g-3 mb-5 g-xl-4 g-xxl-5">
        <>
          {gadgets &&
            gadgets.map((gadget, index) => (
              <Gadget
                address={address}
                gadget={gadget}
                buyGadget={buyGadget}
                deleteGadget={deleteGadget}
                updateGadget={updateGadget}
                archiveGadget={archiveGadget}
                unarchiveGadget={unarchiveGadget}
                refresh={refresh}
                key={index}
              />
            ))}
        </>
      </Row>

      {freebies && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fs-4 fw-bold mb-0"> FreeBies</h1>
        </div>
      )}
      {freebies && (
        <Row xs={1} sm={2} lg={3} className="g-3 mb-5 g-xl-4 g-xxl-5">
          <>
            {freegads &&
              freegads.map((freegad, index) => (
                <FreeGadgets
                  address={address}
                  gadget={freegad}
                  createFreeGadget={createFreeGadget}
                  refresh={refresh}
                  key={index}
                />
              ))}
          </>
        </Row>
      )}
      {owngad && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fs-4 fw-bold mb-0">Archived Gadgets</h1>
        </div>
      )}
      {owngad && (
        <Row xs={1} sm={2} lg={3} className="g-3 mb-5 g-xl-4 g-xxl-5">
          <>
            {archivedgads &&
              archivedgads.map((archgad, index) => (
                <Gadget
                  address={address}
                  gadget={archgad}
                  buyGadget={buyGadget}
                  deleteGadget={deleteGadget}
                  updateGadget={updateGadget}
                  archiveGadget={archiveGadget}
                  unarchiveGadget={unarchiveGadget}
                  refresh={refresh}
                  key={index}
                />
              ))}
          </>
        </Row>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-4 fw-bold mb-0">My Gadgets</h1>
      </div>

      <Row xs={1} sm={2} lg={3} className="g-3 mb-5 g-xl-4 g-xxl-5">
        <>
          {usergads &&
            usergads.map((usergad, index) => (
              <UserGadgets
                address={address}
                gadget={usergad}
                deleteGadget={deleteGadget}
                key={index}
              />
            ))}
        </>
      </Row>
    </>
  );
};

Gadgets.propTypes = {
  address: PropTypes.string.isRequired,
  fetchBalance: PropTypes.func.isRequired,
  refresh: PropTypes.func.isRequired,
};

export default Gadgets;
