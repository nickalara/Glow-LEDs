import axios from "axios";
import fs from "fs";
import config from "../../config.js";
import path from "path";

export const normalizeExpenseFilters = input => {
  const output = {};
  Object.keys(input).forEach(key => {
    if (input[key] && input[key].length > 0) {
      output[key] = input[key][input[key].length - 1];
    }
  });
  if (input.is_subscription && input.is_subscription.includes("only_is_subscription")) {
    output.is_subscription = true;
  }
  return output;
};

export const normalizeExpenseSearch = query => {
  // Check if the search query is empty
  if (!query.search) {
    return {};
  }

  // Check if the search query is a number (for amount search)
  const isNumeric = !Number.isNaN(parseFloat(query.search)) && Number.isFinite(parseFloat(query.search));

  if (isNumeric) {
    const numericValue = parseFloat(query.search);
    // For amount searches, use a small range to catch values that are very close
    // This is more useful than exact matches only, especially with floating point values
    const precision = 0.005; // Half a cent precision
    return {
      amount: {
        $gte: numericValue - precision,
        $lte: numericValue + precision,
      },
    };
  }

  // For text searches, look in multiple fields
  const searchRegex = {
    $regex: query.search.toLowerCase(),
    $options: "i",
  };

  return {
    $or: [{ expense_name: searchRegex }, { place_of_purchase: searchRegex }, { category: searchRegex }],
  };
};

export const sanitizeExpenseName = expenseName => {
  return expenseName.trim().replace(/[:/\s]/g, "_");
};

export const downloadFile = async (url, filePath, _expenseName) => {
  try {
    const dir = path.dirname(filePath);

    // If the directory does not exist, create it
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Get the response stream from axios request
    const response = await axios.get(url, { responseType: "stream" });

    // Check if the status is OK
    if (response.status === 200) {
      // Determine the file extension from the content-type header
      let extension = "";
      const contentType = response.headers["content-type"];
      if (contentType === "application/pdf") {
        extension = ".pdf";
      } else if (contentType === "image/jpeg") {
        extension = ".jpg";
      } else if (contentType === "image/png") {
        extension = ".png";
      } else if (contentType === "image/heic") {
        extension = ".heic";
      } else {
        // throw new Error(`Unsupported content type: ${contentType}`);
      }

      // Append the correct file extension to the file path
      const outputPath = filePath.endsWith(extension) ? filePath : filePath + extension;

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      // return new Promise((resolve, reject) => {
      //   writer.on("finish", async () => {
      //     if (extension === ".pdf") {
      //       const options = {
      //         density: 100,
      //         saveFilename: expenseName,
      //         savePath: dir,
      //         format: "png",
      //         width: 600,
      //         height: 600
      //       };

      //       const storeAsImage = fromPath(outputPath, options);

      //       try {
      //         await storeAsImage.bulk(-1);
      //         resolve();
      //       } catch (error) {
      //         console.error(`Failed to convert pdf to png: ${error}`);
      //         reject(error);
      //       }
      //     } else {
      //       resolve();
      //     }
      //   });
      //   writer.on("error", reject);
      // });
    } else {
      throw new Error(`Failed to download file with status code: ${response.status}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};

export const uploadToImgur = async (albumName, filePath) => {
  try {
    const albumResponse = await axios.post(
      "https://api.imgur.com/3/album",
      { title: albumName, privacy: "hidden" },
      {
        headers: { Authorization: `Client-ID ${config.IMGUR_ClIENT_ID}` },
      }
    );
    const album = albumResponse.data.data;
    const imgResponse = await axios.post("https://api.imgur.com/3/image", fs.createReadStream(filePath), {
      headers: {
        Authorization: `Client-ID ${config.IMGUR_ClIENT_ID}`,
        "Content-Type": "multipart/form-data",
      },
      params: { album: album.deletehash },
    });

    return imgResponse.data.data.link;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }

  // Return undefined explicitly to fix the linter error
  return undefined;
};

export const deleteTempFile = filePath => {
  try {
    fs.unlink(filePath, err => {
      if (err) throw err;
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
};

export const determine_category = place_of_purchase => {
  if (
    place_of_purchase.includes("AMAZON") ||
    place_of_purchase.includes("Amazon") ||
    place_of_purchase.includes("AMZN")
  ) {
    return "Supplies";
  } else if (place_of_purchase.includes("PIRATE SHIP")) {
    return "Shipping";
  } else if (place_of_purchase.includes("DOLLARTREE")) {
    return "Supplies";
  } else if (place_of_purchase.includes("THE HOME DEPOT")) {
    return "Supplies";
  } else if (place_of_purchase.includes("GLOW-LEDS")) {
    return "Business";
  } else if (place_of_purchase.includes("THROWLIGHTS") || place_of_purchase.includes("Throwlights")) {
    return "Equipment";
  } else if (place_of_purchase.includes("GOOGLE") || place_of_purchase.includes("Google")) {
    return "Website";
  } else if (place_of_purchase.includes("PRUSA") || place_of_purchase.includes("Prusa")) {
    return "Equipment";
  } else if (place_of_purchase.includes("EMAZINGLIGHTS")) {
    return "Equipment";
  } else if (place_of_purchase.includes("HOBBY") || place_of_purchase.includes("Hobby")) {
    return "Equipment";
  } else if (place_of_purchase.includes("DIGI KEY") || place_of_purchase.includes("Digi key")) {
    return "Supplies";
  } else if (place_of_purchase.includes("EASYPOST") || place_of_purchase.includes("Easypost")) {
    return "Shipping";
  } else if (place_of_purchase.includes("PAYPAL") || place_of_purchase.includes("PayPal")) {
    return "Supplies";
  } else if (place_of_purchase.includes("HEROKU") || place_of_purchase.includes("Heroku")) {
    return "Website";
  } else if (place_of_purchase.includes("ALIBABA") || place_of_purchase.includes("Alibaba")) {
    return "Supplies";
  } else if (place_of_purchase.includes("PAK") || place_of_purchase.includes("Pak")) {
    return "Shipping";
  } else if (place_of_purchase.includes("KANDEKREATIONS") || place_of_purchase.includes("Kandekreations")) {
    return "Supplies";
  } else if (place_of_purchase.includes("FUTURISTIC") || place_of_purchase.includes("Futuristic")) {
    return "Supplies";
  } else if (place_of_purchase.includes("LEDGLOVES") || place_of_purchase.includes("LEDGloves")) {
    return "Supplies";
  } else if (place_of_purchase.includes("EMAZING") || place_of_purchase.includes("Emazing")) {
    return "Supplies";
  } else if (place_of_purchase.includes("SPEC") || place_of_purchase.includes("Spec")) {
    return "Entertainment";
  } else {
    return "Not Categorized";
  }
};
export const determine_place = place_of_purchase => {
  if (
    place_of_purchase.includes("AMAZON") ||
    place_of_purchase.includes("Amazon") ||
    place_of_purchase.includes("AMZN")
  ) {
    return "Amazon";
  } else if (place_of_purchase.includes("PIRATE SHIP")) {
    return "Pirate Ship";
  } else if (place_of_purchase.includes("DOLLARTREE")) {
    return "DollarTree";
  } else if (place_of_purchase.includes("THE HOME DEPOT")) {
    return "The Home Depot";
  } else if (place_of_purchase.includes("GLOW-LEDS")) {
    return "Glow LEDs";
  } else if (place_of_purchase.includes("THROWLIGHTS") || place_of_purchase.includes("Throwlights")) {
    return "Throwlights";
  } else if (place_of_purchase.includes("PRUSA") || place_of_purchase.includes("Prusa")) {
    return "Prusa";
  } else if (place_of_purchase.includes("EMAZINGLIGHTS")) {
    return "Emazinglights";
  } else if (place_of_purchase.includes("GOOGLE") || place_of_purchase.includes("Google")) {
    return "Google";
  } else if (place_of_purchase.includes("HOBBY") || place_of_purchase.includes("Hobby")) {
    return "Hobby Lobby";
  } else if (place_of_purchase.includes("DIGI KEY") || place_of_purchase.includes("Digi key")) {
    return "Digi Key";
  } else if (place_of_purchase.includes("EASYPOST") || place_of_purchase.includes("Easypost")) {
    return "EasyPost";
  } else if (place_of_purchase.includes("PAYPAL") || place_of_purchase.includes("PayPal")) {
    return "PayPal";
  } else if (place_of_purchase.includes("HEROKU") || place_of_purchase.includes("Heroku")) {
    return "Heroku";
  } else if (place_of_purchase.includes("ALIBABA") || place_of_purchase.includes("Alibaba")) {
    return "Alibaba";
  } else if (place_of_purchase.includes("PAK") || place_of_purchase.includes("Pak")) {
    return "PAK Mail";
  } else if (place_of_purchase.includes("KANDEKREATIONS") || place_of_purchase.includes("Kandekreations")) {
    return "Kandekreations";
  } else if (place_of_purchase.includes("FUTURISTIC") || place_of_purchase.includes("Futuristic")) {
    return "Futuristic";
  } else if (place_of_purchase.includes("LEDGLOVES") || place_of_purchase.includes("LEDGloves")) {
    return "LEDGloves";
  } else if (place_of_purchase.includes("EMAZING") || place_of_purchase.includes("Emazing")) {
    return "EmazingLights";
  } else if (place_of_purchase.includes("SPEC") || place_of_purchase.includes("Spec")) {
    return "Spec's";
  } else {
    return "Unknown";
  }
};
export const determine_application = place_of_purchase => {
  if (place_of_purchase.includes("PIRATE SHIP")) {
    return "Shipping";
  } else if (
    place_of_purchase.includes("AMAZON") ||
    place_of_purchase.includes("Amazon") ||
    place_of_purchase.includes("AMZN")
  ) {
    return "Products";
  } else if (place_of_purchase.includes("THE HOME DEPOT")) {
    return "Tools";
  } else if (place_of_purchase.includes("GLOW-LEDS")) {
    return "Test Purchases";
  } else if (place_of_purchase.includes("PRUSA") || place_of_purchase.includes("Prusa")) {
    return "Tools";
  } else if (place_of_purchase.includes("DOLLARTREE")) {
    return "Shipping";
  } else if (place_of_purchase.includes("EMAZINGLIGHTS")) {
    return "Tools";
  } else if (place_of_purchase.includes("THROWLIGHTS") || place_of_purchase.includes("Throwlights")) {
    return "Accessories";
  } else if (place_of_purchase.includes("GOOGLE") || place_of_purchase.includes("Google")) {
    return "Website";
  } else if (place_of_purchase.includes("HOBBY") || place_of_purchase.includes("Hobby")) {
    return "Tools";
  } else if (place_of_purchase.includes("DIGI KEY") || place_of_purchase.includes("Digi key")) {
    return "Products";
  } else if (place_of_purchase.includes("EASYPOST") || place_of_purchase.includes("Easypost")) {
    return "Shipping";
  } else if (place_of_purchase.includes("PAYPAL") || place_of_purchase.includes("PayPal")) {
    return "Products";
  } else if (place_of_purchase.includes("HEROKU") || place_of_purchase.includes("Heroku")) {
    return "Website";
  } else if (place_of_purchase.includes("ALIBABA") || place_of_purchase.includes("Alibaba")) {
    return "Products";
  } else if (place_of_purchase.includes("PAK") || place_of_purchase.includes("Pak")) {
    return "Shipping";
  } else if (place_of_purchase.includes("KANDEKREATIONS") || place_of_purchase.includes("Kandekreations")) {
    return "Tools";
  } else if (place_of_purchase.includes("FUTURISTIC") || place_of_purchase.includes("Futuristic")) {
    return "Tools";
  } else if (place_of_purchase.includes("LEDGLOVES") || place_of_purchase.includes("LEDGloves")) {
    return "Tools";
  } else if (place_of_purchase.includes("EMAZING") || place_of_purchase.includes("Emazing")) {
    return "Tools";
  } else if (place_of_purchase.includes("SPEC") || place_of_purchase.includes("Spec")) {
    return "Entertainment";
  } else {
    return "Unknown";
  }
};
