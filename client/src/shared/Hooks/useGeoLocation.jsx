/**
 * Author: @nickalara
 * Date: 2025-03-09
 * Description: A hook that gets the user's geolocation data and returns the country.
 * @returns {object} locationData
 */
import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";

export default function useGeoLocation() {
  const [locationData, setLocationData] = useState(null);
  async function getLocation() {
    const res = await axios.get("http://ip-api.com/json");
    if (res.status === 200) setLocationData(res.data);
  }
  useEffect(() => {
    getLocation();
  }, []);
  return {
    country: locationData?.country,
  };
}
