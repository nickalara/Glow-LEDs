export const normalizeEmailFilters = input => {
  const output = {};
  Object.keys(input).forEach(key => {
    if (input[key] && input[key].length > 0) {
      output[key] = input[key][input[key].length - 1];
    }
  });
  return output;
};

export const normalizeEmailSearch = query => {
  const search = query.search
    ? {
        email_name: {
          $regex: query.search.toLowerCase(),
          $options: "i",
        },
      }
    : {};

  return search;
};

export const toCamelCase = string => {
  const words = string.split("_");
  const camelCaseWords = words.map((word, index) => {
    if (index === 0) {
      return word.toLowerCase();
    } else {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
  });
  return camelCaseWords.join("");
};
