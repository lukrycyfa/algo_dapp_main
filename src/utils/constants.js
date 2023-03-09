import algosdk from "algosdk";
import MyAlgoConnect from "@randlabs/myalgo-connect";

const config = {
  algodToken: "",
  algodServer: "https://testnet-api.algonode.network/",
  algodPort: "",
  indexerToken: "",
  indexerServer: "https://testnet-idx.algonode.network/",
  indexerPort: "",
};

export const ALGORAND_DECIMALS = 6;
// ...
export const minRound = 100000000;

// https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0002.md
export const marketplaceNote = "next-softtech:nxt5"; //"tutorial-marketplace:uv1"

// Maximum local storage allocation, immutable
export const numLocalInts = 0;
export const numLocalBytes = 0;
// Maximum global storage allocation, immutable
export const numGlobalInts = 3; // Global variables stored as Int: count, sold, achived
export const numGlobalBytes = 3; // Global variables stored as Bytes: name, description, image

export const algodClient = new algosdk.Algodv2(
  config.algodToken,
  config.algodServer,
  config.algodPort
);

export const indexerClient = new algosdk.Indexer(
  config.indexerToken,
  config.indexerServer,
  config.indexerPort
);

export const myAlgoConnect = new MyAlgoConnect();
