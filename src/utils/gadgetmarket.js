import algosdk from "algosdk";
import {
  algodClient,
  indexerClient,
  marketplaceNote,
  minRound,
  myAlgoConnect,
  numGlobalBytes,
  numGlobalInts,
  numLocalBytes,
  numLocalInts,
} from "./constants";
/* eslint import/no-webpack-loader-syntax: off */
import approvalProgram from "!!raw-loader!../contracts/marketplace_approval.teal";
import clearProgram from "!!raw-loader!../contracts/marketplace_clear.teal";
import { base64ToUTF8String, utf8ToBase64String } from "./conversions";

// added archived to costructor
class Gadget {
  constructor(name, image, description, price, archived, sold, appId, owner) {
    this.name = name;
    this.image = image;
    this.description = description;
    this.price = price;
    this.archived = archived; //takes a value of 1 if the gadget is archived if not 0.
    this.sold = sold;
    this.appId = appId;
    this.owner = owner;
  }
}

//...
// Compile smart contract in .teal format to program
const compileProgram = async (programSource) => {
  let encoder = new TextEncoder();
  let programBytes = encoder.encode(programSource);
  let compileResponse = await algodClient.compile(programBytes).do();
  return new Uint8Array(Buffer.from(compileResponse.result, "base64"));
};

// CREATE GADGET: ApplicationCreateTxn
export const createGadgetAction = async (senderAddress, gadget, user_note) => {
  console.log("Adding new gadget...");

  let params = await algodClient.getTransactionParams().do();
  params.fee = algosdk.ALGORAND_MIN_TX_FEE;
  params.flatFee = true;

  // Compile programs
  const compiledApprovalProgram = await compileProgram(approvalProgram);
  const compiledClearProgram = await compileProgram(clearProgram);

  // Build note to identify transaction later and required app args as Uint8Arrays
  // a condition checking if user_note was passed when the function was called
  // i.e(diffrenciates between created apps and bought created apps)
  let note = "";
  if (user_note) {
    note = user_note;
  } else {
    note = new TextEncoder().encode(marketplaceNote);
  }
  let name = new TextEncoder().encode(gadget.name);
  let image = new TextEncoder().encode(gadget.image);
  let description = new TextEncoder().encode(gadget.description);
  let price = algosdk.encodeUint64(gadget.price);

  let appArgs = [name, image, description, price];

  // Create ApplicationCreateTxn
  let txn = algosdk.makeApplicationCreateTxnFromObject({
    from: senderAddress,
    suggestedParams: params,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram: compiledApprovalProgram,
    clearProgram: compiledClearProgram,
    numLocalInts: numLocalInts,
    numLocalByteSlices: numLocalBytes,
    numGlobalInts: numGlobalInts,
    numGlobalByteSlices: numGlobalBytes,
    note: note,
    appArgs: appArgs,
  });

  // Get transaction ID
  let txId = txn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await myAlgoConnect.signTransaction(txn.toByte());
  console.log("Signed transaction with txID: %s", txId);
  await algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

  // Get the completed Transaction
  console.log(
    "Transaction " +
      txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );

  // Get created application id and notify about completion
  let transactionResponse = await algodClient
    .pendingTransactionInformation(txId)
    .do();
  let appId = transactionResponse["application-index"];
  console.log("Created new app-id: ", appId);
  console.log(Buffer.from(note).toString("base64"));
  return appId;
};

//...
// BUY GADGET: Group transaction consisting of ApplicationCallTxn, PaymentTxn and ApplicationCreateTxn
export const buyGadgetAction = async (senderAddress, gadget, count) => {
  console.log("Buying Gadget...");

  let params = await algodClient.getTransactionParams().do();
  params.fee = algosdk.ALGORAND_MIN_TX_FEE;
  params.flatFee = true;

  // Build required app args as Uint8Array
  let buyArg = new TextEncoder().encode("buy");
  let countArg = algosdk.encodeUint64(count);
  let appArgs = [buyArg, countArg];
  let nprice = gadget.price;

  // Create ApplicationCallTxn
  let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: gadget.appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    appArgs: appArgs,
  });

  // checks if a client is eligible for a discount
  console.log(await discountEligibility(senderAddress), "Checker");
  let val = (70 / 100) * nprice;
  if ( await discountEligibility(senderAddress) === true) {
    if (count === 1) {
      nprice = val;
    } else if (count > 1) {
      nprice = (gadget.price * (count - 1)) + val;
    }
  }
  // Create PaymentTxn
  let paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: senderAddress,
    to: gadget.owner,
    amount: nprice,
    suggestedParams: params,
  });

  let txnArray = [appCallTxn, paymentTxn];

  // Create group transaction out of previously build transactions
  let groupID = algosdk.computeGroupID(txnArray);
  for (let i = 0; i < 2; i++) txnArray[i].group = groupID;

  // Sign & submit the group transaction
  let signedTxn = await myAlgoConnect.signTransaction(
    txnArray.map((txn) => txn.toByte())
  );
  console.log("Signed group transaction");
  let tx = await algodClient
    .sendRawTransaction(signedTxn.map((txn) => txn.blob))
    .do();

  // Wait for group transaction to be confirmed
  let confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);

  // creates a new gadget for the user from values of the original gadget
  // the forloop specifies how many times the gadget get created 
  let user_note = new TextEncoder().encode(
    `${senderAddress.slice(0, 4)}-${senderAddress.slice(54)}:new_user`
  ); // a unique note created from users address
  let num = 1;
  for (num; num <= count; ++num) {
    await createGadgetAction(senderAddress, gadget, user_note);
  }

  // Notify about completion
  console.log(
    "Group transaction " +
      tx.txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );
};

//..
// FREEBIE ELIGIBILITY
// verifies if a user is eligible for a FreeBies
export const FreeBieEligibility = async (senderAddress) => {
  console.log("Checking Eligibility...");
  let discount = false;
  let user_note = new TextEncoder().encode(
    `${senderAddress.slice(0, 4)}-${senderAddress.slice(54)}:new_user`
  );
  let get_app = await indexerClient
    .searchForTransactions()
    .notePrefix(Buffer.from(user_note).toString("base64"))
    .txType("appl")
    .minRound(minRound)
    .do();

  console.log(get_app.transactions.length, "discount_app");
  let dis_val = get_app.transactions.length
  if (dis_val <= 0) {
    discount = false;
  } else if (dis_val > 0 && dis_val % 3 === 0) {
    discount = true;
  } else {
    discount = false;
  }
  console.log(discount);
  return discount;
};

//... Get gadgets specific to loggedin user
export const getUserGadgetAction = async (senderAddress) => {
  console.log("Fetching User Gadgets...");

  // lookup applications created for this account
  let user_note = new TextEncoder().encode(
    `${senderAddress.slice(0, 4)}-${senderAddress.slice(54)}:new_user`
  );
  let get_app = await indexerClient
    .searchForTransactions()
    .notePrefix(Buffer.from(user_note).toString("base64"))
    .txType("appl")
    .minRound(minRound)
    .do();

  console.log(get_app, "users_app");

  let UserGadgets = [];
  for (const tran of get_app.transactions) {
    let appId = tran["created-application-index"];
    if (appId) {
      let gadget = await getApplication(appId);
      if (gadget) {
        // Step 2: Get each application by application id

        UserGadgets.push(gadget);
      }
    }
  }

  console.log(UserGadgets, "Gadgets fetched user.");
  return UserGadgets;
};

//...
// DELETE GADGET: ApplicationDeleteTxn
export const deleteGadgetAction = async (senderAddress, index) => {
  console.log("Deleting Gadget...");

  let params = await algodClient.getTransactionParams().do();
  params.fee = algosdk.ALGORAND_MIN_TX_FEE;
  params.flatFee = true;

  // Create ApplicationDeleteTxn
  let txn = algosdk.makeApplicationDeleteTxnFromObject({
    from: senderAddress,
    suggestedParams: params,
    appIndex: index,
  });

  // Get transaction ID
  let txId = txn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await myAlgoConnect.signTransaction(txn.toByte());
  console.log("Signed transaction with txID: %s", txId);
  await algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

  // Get the completed Transaction
  console.log(
    "Transaction " +
      txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );

  // Get application id of deleted application and notify about completion
  let transactionResponse = await algodClient
    .pendingTransactionInformation(txId)
    .do();
  let appId = transactionResponse["txn"]["txn"].apid;
  console.log("Deleted app-id: ", appId);
};

//..
//GET GADGET: get Dapp Gadgets
export const getGadgetsAction = async (senderAddress) => {
  console.log("Fetching gadgets...");
  let note = new TextEncoder().encode(marketplaceNote);
  let encodedNote = Buffer.from(note).toString("base64");

  // Step 1: Get all transactions by notePrefix (+ minRound filter for performance)
  let transactionInfo = await indexerClient
    .searchForTransactions()
    .notePrefix(encodedNote)
    .txType("appl")
    .minRound(minRound)
    .do();
  console.log(transactionInfo, "dapp_app");
  let allgadgets = [];
  let arcgadgets = [];
  let gadgets = [];
  let freegadgets = [];
  for (const transaction of transactionInfo.transactions) {
    let appId = transaction["created-application-index"];
    if (appId) {
      // Step 2: Get each application by application id
      let gadget = await getApplication(appId);
      if (gadget) {
        // a checker to verify if gadget is archived or not and puts them in seprate arrays
        if (gadget.archived === 0) {
          gadgets.push(gadget);
        } else if (gadget.archived === 1 && gadget.owner === senderAddress) {
          arcgadgets.push(gadget);
        } else if (gadget.archived === 0 && gadget.price <= 8){
            freegadgets.push(gadget);
        }
      }
    }
  }
  allgadgets.push(gadgets);
  console.log(gadgets);
  allgadgets.push(arcgadgets);
  console.log(arcgadgets);
  allgadgets.push(freegadgets);
  console.log(freegadgets);  
  console.log("returning fetched gadgets....");
  return allgadgets;
};

//..
// GET APPLICATION: search the chain for created applications by id.
const getApplication = async (appId) => {
  try {
    // 1. Get application by appId
    let response = await indexerClient
      .lookupApplications(appId)
      .includeAll(true)
      .do();
    if (response.application.deleted) {
      return null;
    }
    let globalState = response.application.params["global-state"];

    // 2. Parse fields of response and return gadget
    let owner = response.application.params.creator;
    let name = "";
    let image = "";
    let description = "";
    let price = 0;
    let archived = 0;
    let sold = 0;

    const getField = (fieldName, globalState) => {
      return globalState.find((state) => {
        return state.key === utf8ToBase64String(fieldName);
      });
    };

    if (getField("NAME", globalState) !== undefined) {
      let field = getField("NAME", globalState).value.bytes;
      name = base64ToUTF8String(field);
    }

    if (getField("IMAGE", globalState) !== undefined) {
      let field = getField("IMAGE", globalState).value.bytes;
      image = base64ToUTF8String(field);
    }

    if (getField("DESCRIPTION", globalState) !== undefined) {
      let field = getField("DESCRIPTION", globalState).value.bytes;
      description = base64ToUTF8String(field);
    }

    if (getField("PRICE", globalState) !== undefined) {
      price = getField("PRICE", globalState).value.uint;
    }

    // checks for archived state
    if (getField("ARCHIVED", globalState) !== undefined) {
      archived = getField("ARCHIVED", globalState).value.uint;
    }

    if (getField("SOLD", globalState) !== undefined) {
      sold = getField("SOLD", globalState).value.uint;
    }

    console.log(response);
    return new Gadget(
      name,
      image,
      description,
      price,
      archived,
      sold,
      appId,
      owner
    ); //added archived
  } catch (err) {
    return null;
  }
};

// SET GADGET ATTRIBUTE
// a funtion that updates Dapp_owner created apps
export const updateGadgetAction = async (senderAddress, gadget) => {
  // try {
  console.log("updating gadget...");

  let params = await algodClient.getTransactionParams().do();
  params.fee = algosdk.ALGORAND_MIN_TX_FEE;
  params.flatFee = true;

  let response = await indexerClient
    .lookupApplications(gadget._appId)
    .includeAll(true)
    .do();
  console.log(response);
  if (response.application.deleted) {
    return null;
  }
  let note = new TextEncoder().encode(marketplaceNote);
  let updateArg = new TextEncoder().encode("update");
  let name = new TextEncoder().encode(gadget._name);
  let image = new TextEncoder().encode(gadget._image);
  let description = new TextEncoder().encode(gadget._description);
  let price = algosdk.encodeUint64(gadget._price);

  let appArgs = [updateArg, name, image, description, price];

  // Set Param ApplicationCallTxn
  console.log(appArgs);
  let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: parseInt(gadget._appId),
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    note: note,
    appArgs: appArgs,
  });
  console.log(appCallTxn);
  // Get transaction ID
  let txId = appCallTxn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await myAlgoConnect.signTransaction(appCallTxn.toByte());
  console.log("Signed transaction with txID: %s", txId, signedTxn);
  await algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

  // Get the completed Transaction
  console.log(
    "Transaction " +
      txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );
  console.log("Updated Application Params");
};

//..
// ARCHIVE GADGET
export const archiveAction = async (senderAddress, appId) => {
  console.log("Moving Gadget To Archive...");

  let response = await indexerClient
    .lookupApplications(appId)
    .includeAll(true)
    .do();
  if (response.application.deleted) {
    return null;
  }


  let note = new TextEncoder().encode(marketplaceNote);
  let archiveArg = new TextEncoder().encode("archive");

  let appArgs = [archiveArg]; // added archived to arggs.

  let params = await algodClient.getTransactionParams().do();
  params.fee = algosdk.ALGORAND_MIN_TX_FEE;
  params.flatFee = true;


  // Set Param ApplicationCallTxn
  let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    note: note,
    appArgs: appArgs,
  });

  // Get transaction ID
  let txId = appCallTxn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await myAlgoConnect.signTransaction(appCallTxn.toByte());
  console.log("Signed transaction with txID: %s", txId);
  await algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

  // Get the completed Transaction
  console.log(
    "Transaction " +
      txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );
  console.log("Updated Application Params", appId);
};

//..
// UNARCHIVE GADGET
export const unarchiveAction = async (senderAddress, appId) => {
  console.log("Removing Gadget from Archive...");

  let response = await indexerClient
    .lookupApplications(appId)
    .includeAll(true)
    .do();
  if (response.application.deleted) {
    return null;
  }

  let note = new TextEncoder().encode(marketplaceNote);
  let unarchiveArg = new TextEncoder().encode("unarchive");

  let appArgs = [unarchiveArg]; // added archived to arggs.

  let params = await algodClient.getTransactionParams().do();
  params.fee = algosdk.ALGORAND_MIN_TX_FEE;
  params.flatFee = true;

 
  // Set Param ApplicationCallTxn
  let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: senderAddress,
    appIndex: appId,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams: params,
    note: note,
    appArgs: appArgs,
  });

  // Get transaction ID
  let txId = appCallTxn.txID().toString();

  // Sign & submit the transaction
  let signedTxn = await myAlgoConnect.signTransaction(appCallTxn.toByte());
  console.log("Signed transaction with txID: %s", txId);
  await algodClient.sendRawTransaction(signedTxn.blob).do();

  // Wait for transaction to be confirmed
  let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

  // Get the completed Transaction
  console.log(
    "Transaction " +
      txId +
      " confirmed in round " +
      confirmedTxn["confirmed-round"]
  );
  console.log("Updated Application Params", appId);
};
