import React from "react";
import { Modal } from "@shopify/polaris";
import Pickpack from "../pages/pickpack"; // adjust path as needed

export default function OrderModals({
  pickActive,
  togglePickActive,
  pickOrders,
  packActive,
  togglePackActive,
  packOrders,
}) {
  return (
    <>
      <Modal
        large
        open={pickActive}
        onClose={togglePickActive}
        title="Pick List"
      >
        <Pickpack orders={pickOrders} type="pick" />
      </Modal>
      <Modal
        large
        open={packActive}
        onClose={togglePackActive}
        title="Pack List"
      >
        <Pickpack orders={packOrders} type="pack" />
      </Modal>
    </>
  );
}
