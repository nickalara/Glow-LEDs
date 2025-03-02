import { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Helmet } from "react-helmet";
import GLTableV2 from "../../shared/GlowLEDsComponents/GLTableV2/GLTableV2";
import {
  open_create_gift_card_modal,
  open_edit_gift_card_modal,
  open_generate_gift_card_modal,
} from "../../slices/giftCardSlice2";
import * as API from "../../api";

import GLIconButton from "../../shared/GlowLEDsComponents/GLIconButton/GLIconButton";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import EditGiftCardModal from "./components/EditGiftCardModal2";
import GenerateGiftCardModal from "./components/GenerateGiftCardModal";
import { formatDate, formatPrice } from "../../utils/helper_functions";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";

const GiftCardsPage = () => {
  const giftCardPage = useSelector(state => state.giftCards.giftCardPage);
  const { loading, remoteVersionRequirement } = giftCardPage;

  const dispatch = useDispatch();

  const columnDefs = useMemo(
    () => [
      { title: "Date Created", display: giftCard => formatDate(giftCard.createdAt) },
      { title: "Code", display: giftCard => giftCard.code },
      { title: "Initial Balance", display: giftCard => formatPrice(giftCard.initialBalance) },
      { title: "Current Balance", display: giftCard => formatPrice(giftCard.currentBalance) },
      { title: "Source", display: giftCard => giftCard.source },
      {
        title: "Expiration",
        display: giftCard => (giftCard.expirationDate ? formatDate(giftCard.expirationDate) : "Never"),
      },
      { title: "Status", display: giftCard => (giftCard.isActive ? "Active" : "Inactive") },
      {
        title: "Actions",
        nonSelectable: true,
        display: giftCard => (
          <Box display="flex" justifyContent="flex-end">
            <GLIconButton tooltip="Edit" onClick={() => dispatch(open_edit_gift_card_modal(giftCard))}>
              <Edit color="white" />
            </GLIconButton>
            <GLIconButton onClick={() => dispatch(API.deleteGiftCard(giftCard._id))} tooltip="Delete">
              <Delete color="white" />
            </GLIconButton>
          </Box>
        ),
      },
    ],
    [dispatch]
  );

  const remoteApi = useCallback(options => API.getGiftCards(options), []);

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Helmet>
        <title>{"Admin Gift Cards | Glow LEDs"}</title>
      </Helmet>

      <GLTableV2
        remoteApi={remoteApi}
        tableName="Gift Cards"
        namespaceScope="giftCards"
        namespace="giftCardTable"
        remoteVersionRequirement={remoteVersionRequirement}
        columnDefs={columnDefs}
        loading={loading}
        enableRowSelect
        titleActions={
          <Box display="flex" gap={2}>
            <Button color="primary" variant="contained" onClick={() => dispatch(open_create_gift_card_modal())}>
              {"Create Gift Card"}
            </Button>
            <Button color="secondary" variant="contained" onClick={() => dispatch(open_generate_gift_card_modal())}>
              {"Generate Gift Card"}
            </Button>
          </Box>
        }
      />

      <EditGiftCardModal />
      <GenerateGiftCardModal />
    </Container>
  );
};
export default GiftCardsPage;
