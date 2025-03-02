export const normalizeContentFilters = input => {
  const output = {};
  Object.keys(input).forEach(key => {
    if (input[key] && input[key].length > 0) {
      output[key] = input[key][input[key].length - 1];
    }
  });
  return output;
};

export const normalizeContentSearch = query => {
  const search = query.search
    ? {
        content_name: {
          $regex: query.search.toLowerCase(),
          $options: "i",
        },
      }
    : {};

  return search;
};
