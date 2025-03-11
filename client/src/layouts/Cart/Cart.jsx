import { useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import useTheme from "@mui/material/styles/useTheme";

import CloseIcon from "@mui/icons-material/Close";
import Add from "@mui/icons-material/Add";
import Sell from "@mui/icons-material/Sell";
import { determineCartTotal } from "../../utils/helper_functions";
import { setCartDrawer } from "../../slices/cartSlice";
import { checkoutHandler, determine_wholesale_proceed } from "./cartHelpers";
import { RecentlyViewed, TopCategories } from "./components";
import { getCartQuantity } from "../../helpers/sharedHelpers";
import GLCartItem from "../../shared/GlowLEDsComponents/GLCartItem/GLCartItem";
import * as API from "../../api";
import GLActionModal from "../../shared/GlowLEDsComponents/GLActionModal/GLActionModal";
import { GLForm } from "../../shared/GlowLEDsComponents/GLForm";
import {
  closeCreateProductBundleModal,
  openCreateProductBundleModal,
  setProductBundle,
} from "../../slices/affiliateSlice";

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();

  const { current_user } = useSelector(state => state.users.userPage);
  const { my_cart, cartDrawer } = useSelector(state => state.carts.cartPage);

  const { create_product_bundle_modal, productBundle, loading } = useSelector(state => state.affiliates.affiliatePage);

  const { cartItems } = my_cart;

  const { contents } = useSelector(state => state.contents.contentPage);

  const closeMenu = useCallback(() => dispatch(setCartDrawer(false)), [dispatch]);

  const handleCheckout = useCallback(
    () => checkoutHandler(dispatch, navigate, current_user, closeMenu, cartItems),
    [dispatch, navigate, current_user, closeMenu, cartItems]
  );

  const wholesaleProceed = useCallback(
    () => determine_wholesale_proceed(current_user, cartItems),
    [current_user, cartItems]
  );

  const formFields = {
    title: { label: "Title", type: "text" },
    subtitle: { label: "Subtitle", type: "text" },
    short_description: { label: "Short Description", type: "text" },
    images: {
      type: "image_upload_multiple",
      label: "Images",
      album: `${productBundle.title} Bundle Images`,
    },
  };

  return (
    <Drawer
      anchor="right"
      transitionDuration={{ enter: 500, exit: 400 }}
      open={cartDrawer}
      onClose={event => {
        if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
          return;
        }
        closeMenu();
      }}
      PaperProps={{
        sx: { width: { xs: "100%", sm: 600 }, backgroundColor: "#333333", color: "white" },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box height="50px" width="50px" mr={1}>
              <img
                className="zoom logo_s"
                src="/images/optimized_images/logo_images/glow_logo_optimized.png"
                alt="Glow LEDs Logo"
                title="Small Logo"
              />
            </Box>
            <Typography variant="h6">
              {"Cart ("}
              {getCartQuantity(cartItems)}
              {")"}
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            {(current_user.isAdmin || current_user.affiliate) && (
              <Button
                onClick={() => {
                  dispatch(openCreateProductBundleModal());
                }}
                color="inherit"
                variant="outlined"
              >
                <Add /> {"Create Bundle"}
              </Button>
            )}
            <Button onClick={closeMenu} color="inherit" variant="outlined">
              <CloseIcon /> {"Close"}
            </Button>
          </Box>
        </Box>
        <Divider color="white" />
        <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
          {cartItems && cartItems.length === 0 ? (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body1">{"Cart is Empty"}</Typography>
              <RecentlyViewed closeMenu={closeMenu} />
              <TopCategories
                category_items={contents.length > 0 && contents[0].menus[0].menu_items}
                closeMenu={closeMenu}
              />
            </Box>
          ) : (
            <List>
              {cartItems?.map((item, index) => (
                <GLCartItem key={index} item={item} index={index} showQuantity />
              ))}
            </List>
          )}
        </Box>
        <Divider color="white" />
        <Box
          sx={{
            p: 2,
            background: `linear-gradient(180deg, ${theme.palette.background.dark} 0%, ${theme.palette.primary.main} 100%)`,
          }}
        >
          <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">{"Total"}</Typography>
            <Typography variant="subtitle1">
              {"$"}
              {determineCartTotal(cartItems, current_user?.isWholesaler)?.toFixed(2)} {"USD"}
            </Typography>
          </Box>
          {sessionStorage.getItem("promo_code") && (
            <Box sx={{ mb: 2 }} display="flex" alignItems="center" justifyContent="space-between" gap={2}>
              <Typography variant="body2">{"Promo code applied at checkout"}</Typography>
              <Box sx={{ mb: 2 }} display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                <Sell />
                <Typography variant="body2">{sessionStorage.getItem("promo_code").toUpperCase()}</Typography>
              </Box>
            </Box>
          )}
          <Typography variant="body2" sx={{ mb: 2 }}>
            {"Taxes and shipping calculated at checkout"}
          </Typography>

          <Box display="flex" justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={closeMenu}
              component={Link}
              to="/checkout/cart"
              sx={{
                fontSize: "1.6rem",
                padding: 1.5,
              }}
            >
              {"View Cart"}
            </Button>
            {current_user?.isWholesaler ? (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleCheckout}
                disabled={!wholesaleProceed()}
                sx={{
                  fontSize: "1.6rem",
                  padding: 1.5,
                }}
              >
                {"Checkout"}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleCheckout}
                sx={{
                  fontSize: "1.6rem",
                  padding: 1.5,
                }}
              >
                {"Checkout"}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
      <GLActionModal
        isOpen={create_product_bundle_modal}
        onConfirm={() => {
          dispatch(
            API.createProductBundle({
              affiliateId: current_user.affiliate,
              cartId: my_cart._id,
              pathname: productBundle.title?.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
              ...productBundle,
            })
          );
        }}
        onCancel={() => {
          dispatch(closeCreateProductBundleModal());
        }}
        title="Create Product Bundle"
        confirmLabel="Create"
        confirmColor="primary"
        cancelLabel="Cancel"
        cancelColor="secondary"
        disableEscapeKeyDown
      >
        <GLForm
          formData={formFields}
          state={productBundle}
          onChange={value => dispatch(setProductBundle(value))}
          loading={loading}
        />
      </GLActionModal>
    </Drawer>
  );
};

export default Cart;
