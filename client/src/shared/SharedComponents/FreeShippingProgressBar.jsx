/**
 * Author: @nickalara
 * Date: 2025-02-21
 * Description: A component that displays a progress bar indicating the user's progress towards free shipping.
 * @param {prop1: number} freeShippingThreshold
 * @param {prop2: number} currentCartSubtotal
 * @returns
 */

import LinearProgress from "@mui/material/LinearProgress";
import useGeoLocation from "../Hooks/useGeoLocation";

const FreeShippingProgressBar = ({ freeShippingThreshold, currentCartSubtotal }) => {
  // Calculate the progress as a percentage. If exceeds 100, set to 100
  let progress = (currentCartSubtotal / freeShippingThreshold) * 100;
  if (progress > 100) progress = 100;
  // Calculate the remaining amount for free shipping
  const remaining = freeShippingThreshold - currentCartSubtotal;
  // Determine the message to display above the progress bar
  const country = useGeoLocation().country;
  // If the user is in the US, display the progress bar
  const freeShippingMessage =
    progress === 100 ? "You have FREE shipping!" : `You are $${remaining.toFixed(2)} away from FREE shipping`;
  // Get the user's country
  const noFreeShippingMessage = "Free shipping is not available in your country.";
  // If the user is in the United States, display the progress bar
  if (country === "United States") {
    return (
      <div>
        <p>{freeShippingMessage}</p>
        {currentCartSubtotal}
        <LinearProgress variant="determinate" value={progress} />
        {freeShippingThreshold}
      </div>
    );
  } else {
    // If the user is not in the United States, display a no free shipping message
    return (
      <div>
        <p>{noFreeShippingMessage}</p>
      </div>
    );
  }
};

export default FreeShippingProgressBar;
