import { make_private_code } from "../../utils/util.js";

export const monthToNum = monthName => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return monthNames.indexOf(monthName) + 1; // +1 because JavaScript months are 0-based
};

// Function to create a public promo code
export const createPublicPromoCode = promoCodeName => {
  return {
    promo_code: promoCodeName.toLowerCase(),
    admin_only: false,
    affiliate_only: false,
    single_use: false,
    used_once: false,
    excluded_categories: [],
    excluded_products: [],
    percentage_off: 10,
    free_shipping: false,
    time_limit: false,
    start_date: "2021-01-01",
    end_date: "2021-01-01",
    active: true,
  };
};

// Function to create a private promo code
export const createPrivatePromoCode = (user, percentageOff = 10) => {
  return {
    promo_code: make_private_code(6),
    user,
    admin_only: false,
    affiliate_only: true,
    single_use: false,
    used_once: false,
    excluded_categories: [],
    excluded_products: [],
    percentage_off: percentageOff,
    free_shipping: false,
    time_limit: false,
    start_date: "2021-01-01",
    end_date: "2021-01-01",
    active: true,
  };
};

export const normalizeAffiliateSearch = query => {
  const search = query.search
    ? {
        artist_name: {
          $regex: query.search.toLowerCase(),
          $options: "i",
        },
      }
    : {};

  return search;
};

export const normalizeAffiliateFilters = input => {
  const output = {};
  Object.keys(input).forEach(key => {
    if (input[key] && input[key].length > 0) {
      output[key] = input[key][input[key].length - 1];
    }
  });

  if (input.promoter && input.promoter.includes("only_promoter")) {
    output.promoter = true;
  }
  if (input.sponsor && input.sponsor.includes("only_sponsor")) {
    output.sponsor = true;
  }
  if (input.sponsor_caption && input.sponsor_caption.includes("only_sponsor_caption")) {
    output.sponsor_caption = true;
  }
  if (input.rave_mob && input.rave_mob.includes("only_rave_mob")) {
    output.rave_mob = true;
  }
  return output;
};

export const determineRevenueTier = (affiliate, revenue) => {
  if (affiliate.sponsor) {
    if (revenue < 150) {
      return 30;
    } else if (revenue >= 150 && revenue < 300) {
      return 35;
    } else if (revenue >= 300 && revenue < 500) {
      return 40;
    } else if (revenue >= 500 && revenue < 750) {
      return 50;
    } else if (revenue >= 750) {
      return 60;
    }
  } else if (affiliate.promoter) {
    if (revenue < 100) {
      return 10;
    } else if (revenue >= 100 && revenue < 200) {
      return 20;
    } else if (revenue >= 200 && revenue < 300) {
      return 25;
    } else if (revenue >= 300 && revenue < 400) {
      return 30;
    } else if (revenue >= 400 && revenue < 500) {
      return 35;
    } else if (revenue >= 500) {
      return 40;
    }
  }
  return 10;
};

export const determineSponsorGiftCard = (affiliate, revenue) => {
  if (affiliate.sponsor) {
    // Check task points and lightshow requirements
    const taskPoints = affiliate.taskPoints || 0;
    const hasLightshow = affiliate.hasLightshow || false;

    if (taskPoints >= 8 && hasLightshow && revenue >= 500) {
      return 100; // Gold level - $100 gift card
    } else if (taskPoints >= 5 && hasLightshow) {
      return 75; // Silver level - $75 gift card
    } else if (taskPoints >= 3) {
      return 50; // Bronze level - $50 gift card
    }
    return 0; // No reward tier met
  }
  return 0;
};
