import React, { useState } from "react";
import Cover from "./components/Cover";
import "./App.css";
import Wallet from "./components/Wallet";
import { Container, Nav } from "react-bootstrap";
import Gadgets from "./components/marketplace/Gadgets";
import { Notification } from "./components/utils/Notifications";
import { indexerClient, myAlgoConnect } from "./utils/constants";
import coverImg from "./assets/img/gadgets.jpg";
//..

//..
const App = function AppWrapper() {
  const [address, setAddress] = useState(null);
  const [name, setName] = useState(null);
  const [balance, setBalance] = useState(0);
  const [ref, setRef] = useState(1);

  const reFresh = async () => {
    setRef(Math.random());
  };

  const fetchBalance = async (accountAddress) => {
    indexerClient
      .lookupAccountByID(accountAddress)
      .do()
      .then((response) => {
        const _balance = response.account.amount;
        setBalance(_balance);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const connectWallet = async () => {
    myAlgoConnect
      .connect()
      .then((accounts) => {
        const _account = accounts[0];
        setAddress(_account.address);
        setName(_account.name);
        fetchBalance(_account.address);
      })
      .catch((error) => {
        console.log("Could not connect to MyAlgo wallet");
        console.error(error);
      });
  };

  const disconnect = () => {
    setAddress(null);
    setName(null);
    setBalance(null);
  };
  //..

  //..
  return (
    <>
      <Notification />
      {address ? (
        <Container fluid="md">
          <Nav className="justify-content-end pt-3 pb-5">
            <Nav.Item>
              <Wallet
                address={address}
                name={name}
                amount={balance}
                disconnect={disconnect}
                symbol={"ALGO"}
              />
            </Nav.Item>
          </Nav>
          <main>
            <Gadgets
              address={address}
              fetchBalance={fetchBalance}
              key={ref}
              refresh={reFresh}
            />
          </main>
        </Container>
      ) : (
        <Cover name={"Gadget Store"} coverImg={coverImg} connect={connectWallet} />
      )}
    </>
  );
};

export default App;
