export const normalizeSurveyFilters = input => {
  const output = {};
  Object.keys(input).forEach(key => {
    if (input[key] && input[key].length > 0) {
      output[key] = input[key][input[key].length - 1];
    }
  });
  return output;
};

export const normalizeSurveySearch = query => {
  const search = query.search
    ? {
        survey_name: {
          $regex: query.search.toLowerCase(),
          $options: "i",
        },
      }
    : {};

  return search;
};
