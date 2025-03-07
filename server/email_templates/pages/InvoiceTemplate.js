import config from "../../config.js";
import { determine_card_logo_images, format_date } from "../../utils/util.js";
import { getItemsTotal, getSaleTotal, hasActiveSale } from "../email_template_helpers.js";
import Price from "../components/Price.js";

export default ({ order, isSponsor }) => {
  return `<body id="invoice" style="background-color:transparent;zoom:100%; font-family: Helvetica; color: black;">
  <div
    style="display:flex;flex-direction:column;margin:40px;margin-top:75px;font-size:25px;line-height:35px;color:black;background-color:white">
    <table cellpadding="0" cellspacing="0" style="width:100%;line-height:inherit;text-align:left;font-size:25px"
      width="100%" align="left">
      <tbody>
        <tr>
          <td colspan="2" style="padding:0" valign="top">
            <table style="width:100%;line-height:inherit;text-align:left" width="100%" align="left">
              <tr>
                <td style="color:#333" valign="top"><img alt="Logo"
                    src="/images/optimized_images/logo_images/glow_logo_desaturated_optimized.png"
                    style="width:500px;margin-left:-5px" /></td>
                <td style="text-align:right;font-size:25px" valign="top" align="right"><strong>Invoice #:</strong>
                  ${order._id}<br /><strong>Created:</strong> ${
                    order.createdAt ? format_date(order.createdAt) : ""
                  }</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td colspan="2" valign="top">
            <table style="width:100%;line-height:inherit;text-align:left;font-size:25px" width="100%" align="left">
              <tr>
                <td valign="top">Glow LEDs<br />${config.PRODUCTION_ADDRESS}<br />${config.PRODUCTION_CITY}, ${
                  config.PRODUCTION_STATE
                } ${config.PRODUCTION_POSTAL_CODE} <br />${config.CONTACT_EMAIL}
                </td>
                <td valign="top" align="right" style="text-align: right;">${order.shipping.first_name}
                  ${order.shipping.last_name}<br>${order.shipping.address_1}
                  ${order.shipping.address_2}<br>${order.shipping.city}, ${order.shipping.state}
                  ${order.shipping.postalCode}<br>${order.shipping.email}</td>
              </tr>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <table cellpadding="0" cellspacing="0" style="width:100%;line-height:inherit;text-align:left;font-size:25px"
      width="100%" align="left">
      <tbody>
        ${
          order.payment.charge
            ? `<tr>
          <td valign="top"
            style="padding: 5px; vertical-align: top; background: rgb(238, 238, 238); border-bottom: 1px solid black; font-weight: bold;">
            Payment Method</td>
          <td valign="top" align="right"
            style="padding: 5px; vertical-align: top; text-align: right; background: rgb(238, 238, 238); border-bottom: 1px solid black; font-weight: bold;">
            Last 4</td>
        </tr>`
            : ""
        }
        ${
          order.payment.charge
            ? `<tr>
          <td valign="top" style="padding: 5px; vertical-align: top; border-bottom: 1px solid black;">
            <img src=${order.payment.payment && determine_card_logo_images(order.payment.payment.card.brand)}
              alt=${order.payment.payment && order.payment.payment.card.brand} title="Card Type Image"
              style="width: 50px; margin-right: 0.5rem;" />
          </td>
          <td valign="top" align="right"
            style="padding: 5px; vertical-align: top; text-align: right; border-bottom: 1px solid black;"><label>
              ${order.payment.payment && order.payment.payment.card.last4}</label></td>
        </tr>`
            : ""
        }
      </tbody>
    </table>
     <table cellpadding="0" cellspacing="0" style="width:100%;line-height:inherit;text-align:left;font-size:25px"
      width="100%" align="left">
      <tbody>
        ${order.orderItems
          .map(
            item => `
        <tr>
          <td style="font-family:helvetica">
            <table style="width:100%;border-spacing:0;border-bottom:1px solid black">
              <tbody>
                <tr style="width:100%">
                  <td style="font-family:helvetica">
                    <table style="border-spacing:0px;width:100%;margin:10px auto">
                      <tbody>
                        <tr>
                          <td style="font-family:helvetica;width:100%">
                             <div style="font-size:25px;color:black">
                              <span style="font-size:25px;font-weight:600;color:black">${item.quantity > 1 ? `${item.quantity}x` : ""} ${item.name}</span>
                              ${item.selectedOptions
                                .map((option, optionIndex) => {
                                  if (option.name && item.currentOptions[optionIndex]) {
                                    return `
                                      <span style="
                                        display:inline-block;
                                        padding:4px 8px;
                                        margin:2px;
                                        border-radius:16px;
                                        font-size:25px;
                                        background-color:white;
                                        border:1px solid black;
                                        color: black;
                                      ">
                                        ${item.currentOptions[optionIndex].name}: ${option.name}
                                      </span>
                                    `;
                                  }
                                  return "";
                                })
                                .filter(Boolean)
                                .join("")}
                            </div>
                          </td>
                          <td style="font-family:helvetica;width:100%;white-space:nowrap">
                            <p style="color:black;line-height:150%;font-size:30px;font-weight:600;margin:0 0 0 15px"
                              align="right">
                             ${Price(item, "black", order?.user?.isWholesaler)}
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <table cellpadding="0" cellspacing="0" style="width:100%;line-height:inherit;text-align:left;font-size:25px"
      width="100%" align="left">
      <tbody>
        <tr>
          <td colspan="2" valign="top">
            <table style="width:100%;line-height:inherit;text-align:left;font-size:25px" width="100%" align="left">
              <tr>
                <td valign="top" style="width:50%;">
                  ${
                    order.promo
                      ? `<div style="padding:5px;vertical-align:top;text-align:left;display:flex" valign="top" align="right">
                    <strong style="margin-right:3px">Promo Code: ${order.promo.promo_code.toUpperCase()}</strong>
                  </div>`
                      : ""
                  }
                  ${
                    order.order_note
                      ? `<div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right"><strong
                      style="margin-right:3px">Order Note: </strong> ${order.order_note}</div>`
                      : ""
                  }
                  ${
                    order.production_note
                      ? `<div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right"><strong
                      style="margin-right:3px">&#x274F; </strong> </div>`
                      : ""
                  }
                  ${
                    isSponsor
                      ? `<div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right"><strong
                      style="margin-right:3px">&#10023; Sponsor Order &#10023;</strong> </div>`
                      : ""
                  }
                </td>
                <td style="text-align:right; width:50%" valign="top" align="right">
                  <table cellpadding="0" cellspacing="0"
                    style="width:100%;line-height:inherit;text-align:left;font-size:25px" width="100%" align="left">
                    <tbody>
                      <tr>
                        <td colspan="2" valign="top">
                          <table style="width:100%;line-height:inherit;text-align:left;font-size:25px" width="100%"
                            align="left">
                            ${
                              !order.promo && !hasActiveSale(order.orderItems) && !order.giftCards?.length
                                ? `<tr>
                                  <td valign="top">
                                    <div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                      Subtotal:</div>
                                  </td>
                                  <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                    <div style="padding:5px;vertical-align:top;text-align:right" valign="top" align="right">
                                      $${getItemsTotal(order.orderItems).toFixed(2)}
                                    </div>
                                  </td>
                                </tr>`
                                : `<tr>
                                  <td valign="top">
                                    <del style="color:red">
                                      <div style="color:#c5c5c5;padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                        Original Subtotal:</div>
                                    </del>
                                  </td>
                                  <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                    <del style="color:red">
                                      <div style="color:#c5c5c5;padding:5px;vertical-align:top;text-align:right" valign="top" align="right">
                                        $${getItemsTotal(order.orderItems).toFixed(2)}
                                      </div>
                                    </del>
                                  </td>
                                </tr>
                                ${
                                  hasActiveSale(order.orderItems)
                                    ? `<tr>
                                      <td valign="top">
                                        <div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                          Sale Discount:</div>
                                      </td>
                                      <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                        <div style="padding:5px;vertical-align:top;text-align:right" valign="top" align="right">
                                          -$${(getItemsTotal(order.orderItems) - getSaleTotal(order.orderItems)).toFixed(2)}
                                        </div>
                                      </td>
                                    </tr>`
                                    : ""
                                }
                                ${
                                  order.promo
                                    ? `<tr>
                                      <td valign="top">
                                        <div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                          Promo Discount:</div>
                                      </td>
                                      <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                        <div style="padding:5px;vertical-align:top;text-align:right" valign="top" align="right">
                                          -$${((order.promo.percentage_off * order.itemsPrice) / 100).toFixed(2)}
                                        </div>
                                      </td>
                                    </tr>`
                                    : ""
                                }
                                ${
                                  order.giftCards && order.giftCards.length > 0
                                    ? order.giftCards
                                        .map(
                                          giftCard => `<tr>
                                          <td valign="top">
                                            <div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                              Gift Card (${giftCard.code.toUpperCase()}):</div>
                                          </td>
                                          <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                            <div style="padding:5px;vertical-align:top;text-align:right" valign="top" align="right">
                                              -$${giftCard.amountUsed.toFixed(2)}
                                            </div>
                                          </td>
                                        </tr>`
                                        )
                                        .join("")
                                    : ""
                                }
                                <tr>
                                  <td valign="top">
                                    <div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                      Final Subtotal:</div>
                                  </td>
                                  <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                    <div style="padding:5px;vertical-align:top;text-align:right" valign="top" align="right">
                                      $${order.itemsPrice.toFixed(2)}
                                    </div>
                                  </td>
                                </tr>`
                            }
                            <tr>
                              <td valign="top">
                                <div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                  Tax:</div>
                              </td>
                              <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                <div style="padding:5px;vertical-align:top;text-align:right" valign="top" align="right">
                                  $${order.taxPrice ? order.taxPrice.toFixed(2) : "0.00"}
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td valign="top">
                                <div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                  Shipping:</div>
                              </td>
                              <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                ${
                                  order.shippingPrice === 0 && order.previousShippingPrice > 0
                                    ? `<del style="color:red">
                                        <div style="color:#c5c5c5;padding:5px;vertical-align:top;text-align:right" valign="top" align="right">
                                          $${order.previousShippingPrice.toFixed(2)}
                                        </div>
                                      </del>`
                                    : `<div style="padding:5px;vertical-align:top;text-align:right" valign="top" align="right">
                                        $${order.shippingPrice.toFixed(2)}
                                      </div>`
                                }
                              </td>
                            </tr>
                            ${
                              order.shippingPrice === 0 && order.previousShippingPrice > 0
                                ? `<tr>
                                  <td valign="top">
                                    <div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                      Shipping Discount:</div>
                                  </td>
                                  <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                    <div style="padding:5px;vertical-align:top;text-align:right" valign="top" align="right">
                                      -$${order.previousShippingPrice.toFixed(2)}
                                    </div>
                                  </td>
                                </tr>
                                <tr>
                                  <td valign="top">
                                    <div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                      New Shipping:</div>
                                  </td>
                                  <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                    <div style="padding:5px;vertical-align:top;text-align:right" valign="top" align="right">
                                      $0.00
                                    </div>
                                  </td>
                                </tr>`
                                : ""
                            }
                            ${
                              order.serviceFee > 0
                                ? `<tr>
                                  <td valign="top">
                                    <div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                      Service Fee (10% for tickets):</div>
                                  </td>
                                  <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                    <div style="padding:5px;vertical-align:top;text-align:right" valign="top" align="right">
                                      $${order.serviceFee.toFixed(2)}
                                    </div>
                                  </td>
                                </tr>`
                                : ""
                            }
                            ${
                              order.tip > 0
                                ? `<tr>
                                  <td valign="top">
                                    <div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                      Tip:</div>
                                  </td>
                                  <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                    <div style="padding:5px;vertical-align:top;text-align:right" valign="top" align="right">
                                      $${order.tip.toFixed(2)}
                                    </div>
                                  </td>
                                </tr>`
                                : ""
                            }
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table cellpadding="0" cellspacing="0"
                    style="width:100%;line-height:inherit;text-align:left;font-size:25px" width="100%" align="left">
                    <tbody>
                      <tr>
                        <td colspan="2" valign="top">
                          <table style="width:100%;line-height:inherit;text-align:left;font-size:25px" width="100%"
                            align="left">
                            <tr>
                              <td>
                                <div style="vertical-align:top;width:100%;margin-left:auto;border-top:1px solid black"
                                  valign="top"></div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table cellpadding="0" cellspacing="0"
                    style="width:100%;line-height:inherit;text-align:left;font-size:25px" width="100%" align="left">
                    <tbody>
                      <tr>
                        <td colspan="2" valign="top">
                          <table style="width:100%;line-height:inherit;text-align:left;font-size:25px" width="100%"
                            align="left">
                            ${
                              hasActiveSale(order.orderItems) || order.promo
                                ? `<tr>
                                  <td valign="top">
                                    <del style="color:red">
                                      <div style="color:#c5c5c5;padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                        Original Order Total:</div>
                                    </del>
                                  </td>
                                  <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                    <del style="color:red">
                                      <div style="color:#c5c5c5;padding:5px;vertical-align:top;text-align:right" valign="top" align="right">
                                        $${(
                                          getItemsTotal(order.orderItems) +
                                          order.taxPrice +
                                          order.shippingPrice +
                                          (order.serviceFee || 0)
                                        ).toFixed(2)}
                                      </div>
                                    </del>
                                  </td>
                                </tr>
                                <tr>
                                  <td valign="top">
                                    <div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                      Final Order Total:</div>
                                  </td>
                                  <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                    <div style="padding:5px;vertical-align:top;text-align:right;font-weight:bold;font-size:30px" valign="top" align="right">
                                      $${order.totalPrice.toFixed(2)}
                                    </div>
                                  </td>
                                </tr>`
                                : `<tr>
                                  <td valign="top">
                                    <div style="padding:5px;vertical-align:top;text-align:left" valign="top" align="right">
                                      Order Total:</div>
                                  </td>
                                  <td style="text-align:right; margin-right:3px;" valign="top" align="right">
                                    <div style="padding:5px;vertical-align:top;text-align:right;font-weight:bold;font-size:30px" valign="top" align="right">
                                      $${order.totalPrice.toFixed(2)}
                                    </div>
                                  </td>
                                </tr>`
                            }
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <div>
      <h3 style="text-align:center; font-size: 30px;">Welcome to the Glow LEDs family!</h3>
      <div style="text-align:center">We are so happy to share our art with you.</div>
      <div style="text-align:center">The code below will take you to our <strong>FAQ page</strong> for all kinds of
        helpful information.</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="text-align:center;width:182px">
          <div style="text-align:center"><strong>Facebook</strong></div>
          <div style="text-align:center">@glowledsofficial</div>
          <div style="text-align:center"><strong>Instagram</strong></div>
          <div style="text-align:center">@glow_leds</div>
        </div><img alt="QR Code" src="/images/optimized_images/logo_images/support_center_qr_code.png"
          style="width:250px;text-align:center" />
        <div style="text-align:center;width:200px">
          <div style="text-align:center"><strong>Tiktok</strong></div>
          <div style="text-align:center">@glow_leds</div>
          <div style="text-align:center"><strong>YouTube</strong></div>
          <div style="text-align:center">Glow LEDs</div>
        </div>
      </div>
      <div style="text-align:center"><strong>Tag us in your videos and pictures!</strong></div>
      <div style="text-align:center">We want to feature you!</div>
      <div style="text-align:center">We are figuring this out as we go so any feedback is welcome.</div>
      <div style="text-align:center">We appreciate you more than you know.</div>
      <div style="text-align:center"><strong>Questions or concerns?:</strong> ${config.CONTACT_EMAIL}</div>
    </div>
  </div>
</body>`;
};
