import binpackingjs from "binpackingjs";

const { BP3D } = binpackingjs;
const { Item, Bin, Packer } = BP3D;

export const determine_parcel = orderItems => {
  const dimensions = getOrderItemDimensions(orderItems);

  // Skip trying to find a predefined parcel and always calculate custom dimensions
  const binDimensions = calculateCustomParcelDimensions(dimensions);

  // Test if the items fit in the custom parcel for validation
  const packingResult = testItemsFit(dimensions, binDimensions);

  // Log packing efficiency
  if (packingResult.success) {
    // eslint-disable-next-line no-console
    console.log(`Custom parcel packing efficiency: ${packingResult.efficiency.toFixed(2)}%`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Warning: Some items may not fit in the custom parcel. Adding extra padding.`);
    // If items don't fit, add more padding
    binDimensions.length = Math.ceil(binDimensions.length * 1.1);
    binDimensions.width = Math.ceil(binDimensions.width * 1.1);
    binDimensions.height = Math.ceil(binDimensions.height * 1.1);
  }

  return createCustomParcel(binDimensions.length, binDimensions.width, binDimensions.height);
};

const getOrderItemDimensions = orderItems =>
  orderItems.map(item => ({
    length: item.dimensions.package_length,
    width: item.dimensions.package_width,
    height: item.dimensions.package_height,
    volume: item.dimensions.package_volume,
    quantity: parseInt(item.quantity, 10),
  }));

const calculateCustomParcelDimensions = dimensions => {
  // Calculate total volume and get maximum dimensions
  const totalVolume = dimensions.reduce((sum, item) => {
    const quantity = item.qty || item.quantity || 1;
    return sum + item.volume * quantity;
  }, 0);

  // Get the max dimensions of items for minimum bin size
  let maxLength = 0;
  let maxWidth = 0;
  let maxHeight = 0;

  dimensions.forEach(item => {
    maxLength = Math.max(maxLength, item.length);
    maxWidth = Math.max(maxWidth, item.width);
    maxHeight = Math.max(maxHeight, item.height);
  });

  // Calculate initial bin dimensions using the cube root of the volume as a starting point
  // Add 15% extra volume for optimal packing space
  const volumeWithBuffer = totalVolume * 1.15;
  const initialSize = Math.cbrt(volumeWithBuffer);

  // Ensure the bin is at least as large as the largest item in each dimension
  const binLength = Math.max(maxLength, initialSize);
  const binWidth = Math.max(maxWidth, initialSize);
  const binHeight = Math.max(maxHeight, initialSize);

  // List of size combinations to try, prioritizing different shapes and orientations
  const sizeCombinations = [
    // Base sizes with different orientations
    { length: binLength, width: binWidth, height: binHeight },
    { length: binLength, width: binHeight, height: binWidth },
    { length: binWidth, width: binLength, height: binHeight },
    { length: binWidth, width: binHeight, height: binLength },
    { length: binHeight, width: binLength, height: binWidth },
    { length: binHeight, width: binWidth, height: binLength },

    // Longer box
    { length: binLength * 1.2, width: binWidth * 0.95, height: binHeight * 0.95 },
    // Wider box
    { length: binLength * 0.95, width: binWidth * 1.2, height: binHeight * 0.95 },
    // Taller box
    { length: binLength * 0.95, width: binWidth * 0.95, height: binHeight * 1.2 },

    // Flatter box
    { length: binLength * 1.1, width: binWidth * 1.1, height: binHeight * 0.85 },

    // More variations with different aspect ratios
    { length: binLength * 1.25, width: binWidth * 0.85, height: binHeight * 0.95 },
    { length: binLength * 0.85, width: binWidth * 1.25, height: binHeight * 0.95 },
    { length: binLength * 0.85, width: binWidth * 0.95, height: binHeight * 1.25 },

    // Add a few more with different proportions
    { length: binLength * 1.15, width: binWidth * 0.9, height: binHeight * 0.95 },
    { length: binLength * 0.9, width: binWidth * 1.15, height: binHeight * 0.95 },
    { length: binLength * 0.95, width: binWidth * 0.9, height: binHeight * 1.15 },
  ];

  // Test each size combination and find the one with the best packing efficiency and smallest volume
  let bestCombination = null;
  let bestEfficiency = 0;
  let bestVolume = Infinity;

  sizeCombinations.forEach(combination => {
    const packingResult = testItemsFit(dimensions, combination);

    if (packingResult.success) {
      const volume = combination.length * combination.width * combination.height;
      const efficiency = packingResult.efficiency;

      // Prefer smaller volumes with good efficiency (efficiency > 70%)
      // If efficiency is high enough, prioritize smaller volumes
      if (
        (efficiency > 70 && volume < bestVolume) ||
        (efficiency > bestEfficiency && (efficiency - bestEfficiency > 5 || volume <= bestVolume * 1.1))
      ) {
        bestCombination = combination;
        bestEfficiency = efficiency;
        bestVolume = volume;
      }
    }
  });

  // If we found a good combination, use it
  if (bestCombination) {
    // eslint-disable-next-line no-console
    console.log(
      `Selected optimal parcel with efficiency: ${bestEfficiency.toFixed(2)}% and volume: ${bestVolume.toFixed(2)}`
    );
    return {
      length: Math.ceil(bestCombination.length),
      width: Math.ceil(bestCombination.width),
      height: Math.ceil(bestCombination.height),
    };
  }

  // Fallback to traditional approach if nothing worked well
  // Add a buffer (25%) to ensure everything fits
  const length = Math.ceil(binLength * 1.25);
  const width = Math.ceil(binWidth * 1.25);
  const height = Math.ceil(binHeight * 1.25);

  // Adjust dimensions to meet minimum requirements
  return {
    length: Math.max(length, 5), // Set a minimum size of 5 inches per side
    width: Math.max(width, 5),
    height: Math.max(height, 2), // Allow height to be smaller for flat items
  };
};

const testItemsFit = (items, binDimensions) => {
  // Create a bin with the given dimensions
  const bin = new Bin(
    "ParcelBin",
    binDimensions.length,
    binDimensions.width,
    binDimensions.height,
    Infinity // Weight capacity (set to Infinity if not concerned with weight limits)
  );

  // Create a packer and add our bin
  const packer = new Packer();
  packer.addBin(bin);

  // Create items from our dimensions and add them to the packer
  const packingItems = [];
  let totalItemVolume = 0;

  items.forEach(item => {
    // Use a counter approach instead of for loop to avoid the unary operator
    let counter = 0;
    const quantity = item.qty || item.quantity || 1;

    while (counter < quantity) {
      const itemVolume = item.length * item.width * item.height;
      totalItemVolume += itemVolume;

      const packingItem = new Item(
        `Item-${packingItems.length}`,
        item.length,
        item.width,
        item.height,
        item.volume / itemVolume // Use density as weight
      );
      packingItems.push(packingItem);
      packer.addItem(packingItem);
      counter += 1; // Use addition assignment instead of increment operator
    }
  });

  // Start packing
  packer.pack();

  // Check packing success and efficiency
  const binVolume = binDimensions.length * binDimensions.width * binDimensions.height;
  const efficiency = (totalItemVolume / binVolume) * 100;

  // Return packing results
  return {
    success: packer.unfitItems.length === 0,
    efficiency,
    packedItems: bin.items,
    unpackedItems: packer.unfitItems,
  };
};

const createCustomParcel = (length, width, height) => {
  return {
    length,
    width,
    height,
    volume: length * width * height,
  };
};

export const determine_parcel_weight = order => {
  let weight = 0;
  order.orderItems.forEach(item => {
    if (item.dimensions.weight_pounds) {
      weight += parseInt(item.dimensions.weight_pounds, 10) * 16 + parseInt(item.dimensions.weight_ounces, 10);
    } else {
      weight += parseInt(item.dimensions.weight_ounces, 10);
    }
    weight *= item.quantity;
  });
  return weight;
};

export const calculateTotalOunces = cartItems => {
  let totalOunces = 0;
  let i = 0;

  while (i < cartItems.length) {
    const item = cartItems[i];
    // Fix unsafe optional chaining with proper null checks
    const weightPounds = item.dimensions && item.dimensions.weight_pounds ? item.dimensions.weight_pounds : 0;
    const weightOunces = item.dimensions && item.dimensions.weight_ounces ? item.dimensions.weight_ounces : 0;
    const weightInOunces = weightPounds * 16 + weightOunces;

    totalOunces += weightInOunces * item.quantity;
    i += 1; // Use addition assignment instead of increment operator
  }

  return totalOunces;
};

export const covertToOunces = item => {
  if (!item || !item.dimensions) return 0;

  const weightPounds = item.dimensions.weight_pounds || 0;
  const weightOunces = item.dimensions.weight_ounces || 0;

  return weightPounds * 16 + weightOunces;
};

export const calculateTotalPounds = cartItems => {
  let totalOunces = 0;
  let i = 0;

  while (i < cartItems.length) {
    const item = cartItems[i];
    const weightInOunces = item.dimensions.weight_pounds * 16 + item.dimensions.weight_ounces;
    totalOunces += weightInOunces * item.quantity;
    i += 1; // Use addition assignment instead of increment operator
  }

  const totalPounds = totalOunces / 16;
  return totalPounds;
};

export const parseOrderData = (shipment, order) => {
  try {
    const data = {
      "to_address.name": shipment.buyer_address.name,
      "to_address.company": shipment.buyer_address.company || "",
      "to_address.phone": shipment.buyer_address.phone || "",
      "to_address.email": shipment.buyer_address.email || "",
      "to_address.street1": shipment.buyer_address.street1,
      "to_address.street2": shipment.buyer_address.street2 || "",
      "to_address.city": shipment.buyer_address.city,
      "to_address.state": shipment.buyer_address.state,
      "to_address.zip": shipment.buyer_address.zip,
      "to_address.country": shipment.buyer_address.country,
      "from_address.name": shipment.return_address.name || "",
      "from_address.company": shipment.return_address.company || "",
      "from_address.phone": shipment.return_address.phone || "",
      "from_address.email": shipment.return_address.email || "",
      "from_address.street1": shipment.return_address.street1,
      "from_address.street2": shipment.return_address.street2 || "",
      "from_address.city": shipment.return_address.city,
      "from_address.state": shipment.return_address.state,
      "from_address.zip": shipment.return_address.zip,
      "from_address.country": shipment.return_address.country,
      "parcel.length": shipment.parcel.length,
      "parcel.width": shipment.parcel.width,
      "parcel.height": shipment.parcel.height,
      "parcel.weight": shipment.parcel.weight,
      "parcel.predefined_package": shipment.parcel.predefined_package || "",
      carrier: order.shipping.shipping_rate.carrier,
      service: order.shipping.shipping_rate.service,
      "customs.customs_certify": shipment.customs_info.customs_certify,
      "customs.customs_signer": shipment.customs_info.customs_signer,
      "customs.contents_type": shipment.customs_info.contents_type,
      "customs.restriction_type": shipment.customs_info.restriction_type,
      "customs.eel_pfc": shipment.customs_info.eel_pfc,
      "customs_item.description": shipment.customs_info.customs_items[0].description,
      "customs_item.quantity": shipment.customs_info.customs_items[0].quantity,
      "customs_item.weight_oz": shipment.customs_info.customs_items[0].weight_oz,
      "customs_item.value": shipment.customs_info.customs_items[0].value,
      "customs_item.code": shipment.customs_info.customs_items[0].code,
      "customs_item.hs_tariff_number": shipment.customs_info.customs_items[0].hs_tariff_number,
      "customs_item.origin_country": shipment.customs_info.customs_items[0].origin_country,
    };
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    // Ensure a return value even if the Error doesn't match instanceof Error
    return null;
  }
};
