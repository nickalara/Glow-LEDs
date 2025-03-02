export const normalizePaycheckFilters = input => {
  const output = {};
  Object.keys(input).forEach(key => {
    if (input[key] && input[key].length > 0) {
      output[key] = input[key][input[key].length - 1];
    }
  });
  return output;
};

export const normalizePaycheckSearch = query => {
  const search = {};
  if (query.search) {
    const amountNumber = parseFloat(query.search);
    if (!Number.isNaN(amountNumber)) {
      search.amount = amountNumber;
    }
  }
  return search;
};
