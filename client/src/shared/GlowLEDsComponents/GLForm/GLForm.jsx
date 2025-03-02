import { useSelector } from "react-redux";

import PropTypes from "prop-types";
import { DropdownDisplayV2 } from "../../SharedComponents";
import ImageWizard from "../../SharedComponents/ImageWizard";
import { determine_shown_fields, getEmptyObjectFromSchema, getValueByStringPath } from "./glFormHelpers";
import GoogleAutocomplete from "../../../pages/PlaceOrderPage/components/GoogleAutocomplete";
import config from "../../../config";
import { useEffect, useState } from "react";
import GLColorPicker from "./components/GLColorPicker";
import GLArray from "./components/GLArray";
import GLAutocomplete from "../GLAutocomplete/GLAutocomplete";
import GLTextFieldV2 from "../GLTextFieldV2/GLTextFieldV2";
import GLOptionSelector from "./components/GLOptionSelector";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
dayjs.extend(utc);

const GLForm = ({ formData, onChange, state, loading, formErrors, setFormErrors, classes, mode, index }) => {
  const userPage = useSelector(state => state.users.userPage);
  const { current_user } = userPage;

  useEffect(() => {
    setFormErrors({ ...formErrors });
  }, []);

  const determineOptions = (fieldData, fieldState) => {
    if (typeof fieldData.options === "string") {
      return getValueByStringPath(fieldState, fieldData.options);
    } else {
      return fieldData.options || [];
    }
  };

  const handleInputChange = (fieldName, value) => {
    onChange({ [fieldName]: value }, fieldName);
  };

  const [tabIndex, setTabIndex] = useState(0);

  const [inputValue, setInputValue] = useState("");
  const [highlightedOption, setHighlightedOption] = useState(null);

  const handleEnterKeyPress = (event, fieldData, fieldName) => {
    if (event.key === "Enter") {
      // If we already have a highlighted option, use that
      if (highlightedOption) {
        const savedValue = fieldData.getOptionValue ? fieldData.getOptionValue(highlightedOption) : highlightedOption;
        handleInputChange(fieldName, savedValue);
        return;
      }

      // Try to find a matching option in the options list
      const matchingOption =
        Array.isArray(fieldData.options) &&
        fieldData.options.find(opt => {
          const optionLabel = fieldData.getOptionLabel
            ? fieldData.getOptionLabel(opt)
            : typeof opt === "string"
              ? opt
              : opt[fieldData.labelProp];
          return optionLabel === inputValue;
        });

      if (matchingOption) {
        const savedValue = fieldData.getOptionValue ? fieldData.getOptionValue(matchingOption) : matchingOption;
        handleInputChange(fieldName, savedValue);
      } else if (fieldData.freeSolo !== false) {
        // In freeSolo mode, use the input value directly if no matching option
        handleInputChange(fieldName, inputValue);
      }
    }
  };

  return (
    <>
      {formData &&
        Object.keys(formData).map(fieldName => {
          const fieldData = formData[fieldName];
          const fieldState = state[fieldName] ?? {};

          if (loading) {
            if (fieldData.type === "checkbox") {
              return (
                <Skeleton
                  key={`${fieldName}-${fieldData.type}`}
                  variant="circle"
                  width={200}
                  height={20}
                  style={{ marginTop: 25, marginRight: 16 }}
                />
              );
            } else if (fieldData.type === "array" || fieldData.type === "object") {
              return (
                <Skeleton
                  key={`${fieldName}-${fieldData.type}`}
                  variant="rectangular"
                  height={500}
                  style={{ marginTop: 22 }}
                />
              );
            } else {
              return (
                <Skeleton
                  key={`${fieldName}-${fieldData.type}`}
                  variant="rectangular"
                  height={40}
                  style={{ marginTop: 22 }}
                />
              );
            }
          } else if (determine_shown_fields(fieldData, current_user, mode)) {
            switch (fieldData.type) {
              case "autocomplete_single": {
                const options = Array.isArray(fieldData.options) ? fieldData.options : [];
                const selected = fieldData.valueAttribute
                  ? options.find(opt => opt[fieldData.valueAttribute] === fieldState)
                  : fieldState;

                return (
                  <Box display="flex" flexDirection="column" gap={1} justifyContent="space-between">
                    <GLAutocomplete
                      key={`${fieldName}-${fieldData.type}`}
                      autoComplete="new-password"
                      freeSolo
                      customClasses={classes}
                      helperText={formErrors && formErrors[fieldName]}
                      error={formErrors && Boolean(formErrors[fieldName])}
                      margin="normal"
                      loading={!fieldData.loading}
                      value={selected || ""}
                      disabled={fieldData.disabled}
                      options={(!fieldData.loading && determineOptions(fieldData, state)) || []}
                      getOptionLabel={option =>
                        option
                          ? typeof option === "string"
                            ? option
                            : fieldData.getOptionLabel
                              ? fieldData.getOptionLabel(option)
                              : option[fieldData.labelProp] || ""
                          : ""
                      }
                      optionDisplay={option =>
                        fieldData.getOptionLabel ? fieldData.getOptionLabel(option) : option[fieldData.labelProp]
                      }
                      isOptionEqualToValue={fieldData.isOptionEqualToValue}
                      name={fieldName}
                      label={fieldData.label}
                      onChange={(event, value) => {
                        // Handle both string and object values
                        const savedValue =
                          value === null ? "" : fieldData.getOptionValue ? fieldData.getOptionValue(value) : value;
                        handleInputChange(fieldName, savedValue);
                      }}
                      inputValue={inputValue}
                      onHighlightChange={(event, option, reason) => {
                        if (reason === "keyboard" || reason === "auto") {
                          setHighlightedOption(option);
                        }
                      }}
                      onInputChange={(event, newInputValue, reason) => {
                        if (reason === "input") {
                          setInputValue(newInputValue);
                          setHighlightedOption(null); // Clear highlighted option when user types

                          // For freeSolo mode, update the form state directly with the typed value
                          // This allows users to enter custom values that aren't in the options list
                          if (fieldData.freeSolo !== false) {
                            handleInputChange(fieldName, newInputValue);
                          }
                        }
                      }}
                      onKeyDown={event => {
                        handleEnterKeyPress(event, fieldData, fieldName);
                      }}
                    />

                    {fieldData.showEditButton && (
                      <>
                        {selected?.name && (
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={() => {
                              fieldData.onEditButtonClick(selected);
                            }}
                          >
                            {"Edit "}
                            {selected?.name}
                          </Button>
                        )}
                        <Button
                          variant="contained"
                          color="secondary"
                          fullWidth
                          onClick={() => {
                            fieldData.onCreateNewButtonClick({
                              _id: null,
                              name: `${selected.name} Copy`,
                              pathname: `${selected.pathname}_copy`,
                              ...selected,
                            });
                          }}
                        >
                          {"New Based On "}
                          {selected?.name}
                        </Button>
                      </>
                    )}
                  </Box>
                );
              }
              case "image_upload_single":
              case "image_upload_multiple":
                return (
                  <ImageWizard
                    fieldData={fieldData}
                    fieldState={fieldState}
                    fieldName={fieldName}
                    onChange={value => {
                      handleInputChange(fieldName, value);
                    }}
                    isMultiple={fieldData.type === "image_upload_multiple"}
                  />
                );

              case "autocomplete_multiple":
                return (
                  <DropdownDisplayV2
                    key={`${fieldName}-${fieldData.type}`}
                    margin="normal"
                    value={fieldState || ""}
                    options={fieldData.options || []}
                    getOptionLabel={option =>
                      option
                        ? fieldData.getOptionLabel
                          ? fieldData.getOptionLabel(option)
                          : option[fieldData.labelProp]
                        : ""
                    }
                    optionDisplay={option =>
                      fieldData.getOptionLabel ? fieldData.getOptionLabel(option) : option[fieldData.labelProp]
                    }
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    fieldName={fieldName}
                    disabled={fieldData.disabled}
                    labelProp={fieldData.labelProp}
                    label={fieldData.label}
                    onChange={value => handleInputChange(fieldName, value)}
                    onEdit={fieldData.onEdit}
                    showItems
                  />
                );

              case "checkbox":
                return (
                  <FormControlLabel
                    sx={fieldData.leftSpacing ? { ml: 1 } : {}}
                    key={`${fieldName}-${fieldData.type}`}
                    control={
                      <Checkbox
                        name={fieldName}
                        size="large"
                        onChange={e => handleInputChange(fieldName, e.target.checked)}
                        checked={Boolean(fieldState)}
                        // error={formErrors && !!formErrors[fieldName]}
                      />
                    }
                    label={fieldData.label}
                  />
                );

              case "simple_array":
                return (
                  <GLForm
                    formData={fieldData.fields}
                    state={fieldState}
                    onChange={newObjectState => {
                      onChange({
                        [fieldName]: { ...fieldState, ...newObjectState },
                      });
                    }}
                    loading={loading}
                  />
                );

              case "title":
                return (
                  <Typography
                    key={`${fieldName}-${fieldData.type}`}
                    variant={fieldData.variant}
                    align={fieldData.align}
                  >
                    {fieldData.label}
                  </Typography>
                );

              case "autocomplete_address":
                return (
                  <GoogleAutocomplete
                    key={`${fieldName}-${fieldData.type}`}
                    name={fieldName}
                    helperText={formErrors && formErrors[fieldName]}
                    error={formErrors && Boolean(formErrors[fieldName])}
                    label={fieldData.label}
                    margin="normal"
                    size="small"
                    variant="outlined"
                    className={classes.outlinedInput}
                    fullWidth
                    // autoComplete="new-password"
                    InputProps={{
                      // autocomplete: "new-password",
                      // form: {
                      //   autocomplete: "off",
                      // },
                      className: classes.input,
                    }}
                    InputLabelProps={{
                      className: classes.label,
                    }}
                    FormHelperTextProps={{
                      className:
                        formErrors && Boolean(formErrors[fieldName]) ? classes.errorHelperText : classes.helperText,
                    }}
                    apiKey={config.VITE_GOOGLE_PLACES_KEY}
                    value={fieldState || ""}
                    options={{
                      types: ["address"],
                    }}
                    onPlaceSelected={place => {
                      fieldData.setGeneratedAddress(place);
                    }}
                    onChange={e => handleInputChange(fieldName, e.target.value)}
                  />
                );

              case "text":
                return (
                  <GLTextFieldV2
                    helperText={formErrors && formErrors[fieldName]}
                    error={formErrors && Boolean(formErrors[fieldName])}
                    autoComplete="new-password"
                    className={classes.outlinedInput}
                    disabled={fieldData.disabled}
                    InputProps={{
                      autoComplete: "new-password",
                      form: {
                        autoComplete: "off",
                      },
                      className: classes.input,
                    }}
                    InputLabelProps={{
                      className: classes.label,
                    }}
                    FormHelperTextProps={{
                      className:
                        formErrors && Boolean(formErrors[fieldName]) ? classes.errorHelperText : classes.helperText,
                    }}
                    key={`${fieldName}-${fieldData.type}`}
                    name={fieldName}
                    sx={fieldData.leftSpacing ? { ml: 1 } : {}}
                    margin="normal"
                    size="small"
                    fullWidth
                    type={fieldData.type}
                    label={fieldData.label}
                    upperCase={fieldData.upperCase}
                    lowerCase={fieldData.lowerCase}
                    noSpace={fieldData.noSpace}
                    restrictCharacters={fieldData?.restrictCharacters}
                    variant="outlined"
                    value={typeof fieldState === "object" && Object.keys(fieldState).length === 0 ? "" : fieldState}
                    onChange={e => handleInputChange(fieldName, e.target.value)}
                  />
                );

              case "number":
                return (
                  <GLTextFieldV2
                    helperText={formErrors && formErrors[fieldName]}
                    autoComplete="new-password"
                    error={formErrors && Boolean(formErrors[fieldName])}
                    className={classes.outlinedInput}
                    disabled={fieldData.disabled}
                    InputProps={{
                      autoComplete: "new-password",
                      form: {
                        autoComplete: "off",
                      },
                      className: classes.input,
                    }}
                    InputLabelProps={{
                      className: classes.label,
                    }}
                    FormHelperTextProps={{
                      className:
                        formErrors && Boolean(formErrors[fieldName]) ? classes.errorHelperText : classes.helperText,
                    }}
                    key={`${fieldName}-${fieldData.type}`}
                    name={fieldName}
                    margin="normal"
                    size="small"
                    fullWidth
                    type={fieldData.type}
                    label={fieldData.label}
                    variant="outlined"
                    value={typeof fieldState === "object" && Object.keys(fieldState).length === 0 ? "" : fieldState}
                    onChange={e => handleInputChange(fieldName, e.target.value)}
                  />
                );

              case "date": {
                return (
                  <GLTextFieldV2
                    helperText={formErrors && formErrors[fieldName]}
                    autoComplete="new-password"
                    error={formErrors && Boolean(formErrors[fieldName])}
                    className={classes.outlinedInput}
                    disabled={fieldData.disabled}
                    InputProps={{
                      autoComplete: "new-password",
                      form: {
                        autoComplete: "off",
                      },
                      className: classes.input,
                    }}
                    InputLabelProps={{
                      className: classes.label,
                    }}
                    FormHelperTextProps={{
                      className:
                        formErrors && Boolean(formErrors[fieldName]) ? classes.errorHelperText : classes.helperText,
                    }}
                    key={`${fieldName}-${fieldData.type}`}
                    name={fieldName}
                    margin="normal"
                    size="small"
                    fullWidth
                    type={fieldData.type}
                    label={fieldData.label}
                    variant="outlined"
                    value={dayjs(fieldState).utc().format("YYYY-MM-DD")}
                    onChange={e => {
                      // Convert the local date input back to UTC
                      const utcValue = dayjs(e.target.value).utc().format();
                      handleInputChange(fieldName, utcValue);
                    }}
                  />
                );
              }
              case "datetime":
                return (
                  <GLTextFieldV2
                    helperText={formErrors && formErrors[fieldName]}
                    autoComplete="new-password"
                    error={formErrors && Boolean(formErrors[fieldName])}
                    className={classes.outlinedInput}
                    disabled={fieldData.disabled}
                    InputProps={{
                      autoComplete: "new-password",
                      form: {
                        autoComplete: "off",
                      },
                      className: classes.input,
                    }}
                    InputLabelProps={{
                      className: classes.label,
                      shrink: true, // Always keep the label shrunk
                    }}
                    FormHelperTextProps={{
                      className:
                        formErrors && Boolean(formErrors[fieldName]) ? classes.errorHelperText : classes.helperText,
                    }}
                    key={`${fieldName}-${fieldData.type}`}
                    name={fieldName}
                    margin="normal"
                    size="small"
                    fullWidth
                    type="datetime-local"
                    label={fieldData.label}
                    variant="outlined"
                    value={dayjs(fieldState).utc().format("YYYY-MM-DDTHH:mm")}
                    onChange={e => {
                      // Convert the local datetime input back to UTC
                      const utcValue = dayjs(e.target.value).utc().format();
                      handleInputChange(fieldName, utcValue);
                    }}
                  />
                );

              case "text_multiline":
                return (
                  <GLTextFieldV2
                    helperText={formErrors && formErrors[fieldName]}
                    autoComplete="new-password"
                    error={formErrors && Boolean(formErrors[fieldName])}
                    className={classes.outlinedInput}
                    disabled={fieldData.disabled}
                    InputProps={{
                      autoComplete: "new-password",
                      form: {
                        autoComplete: "off",
                      },
                      className: classes.input,
                    }}
                    InputLabelProps={{
                      className: classes.label,
                    }}
                    FormHelperTextProps={{
                      className:
                        formErrors && Boolean(formErrors[fieldName]) ? classes.errorHelperText : classes.helperText,
                    }}
                    key={`${fieldName}-${fieldData.type}`}
                    name={fieldName}
                    margin="normal"
                    size="small"
                    fullWidth
                    type={fieldData.type}
                    label={fieldData.label}
                    upperCase={fieldData.upperCase}
                    lowerCase={fieldData.lowerCase}
                    noSpace={fieldData.noSpace}
                    multiline
                    variant="outlined"
                    value={typeof fieldState === "object" && Object.keys(fieldState).length === 0 ? "" : fieldState}
                    onChange={e => handleInputChange(fieldName, e.target.value)}
                  />
                );

              case "object": {
                const selectedOption = fieldData.valueAttribute
                  ? fieldData.options.find(opt => opt[fieldData.valueAttribute] === fieldState)
                  : fieldState;
                return (
                  <Paper className="p-10px m-10px" key={`${fieldName}-${fieldData.type}`} elevation={5}>
                    <Typography component="h6" variant="h6" className="ta-c">
                      {fieldData.title}
                    </Typography>
                    {fieldData.selectable && (
                      <GLAutocomplete
                        key={`${fieldName}-${fieldData.type}`}
                        autoComplete="new-password"
                        customClasses={classes}
                        disabled={fieldData.disabled}
                        // isOptionEqualToValue={(option, value) => {
                        //   return option.short_name === value.short_name;
                        // }}
                        helperText={formErrors && formErrors[fieldName]}
                        error={formErrors && Boolean(formErrors[fieldName])}
                        margin="normal"
                        value={selectedOption || ""}
                        // value={fieldState || ""}
                        options={determineOptions(fieldData, state) || []}
                        getOptionLabel={option =>
                          option
                            ? typeof option === "string"
                              ? option
                              : fieldData.getOptionLabel
                                ? fieldData.getOptionLabel(option)
                                : option[fieldData.labelProp] || ""
                            : ""
                        }
                        optionDisplay={option =>
                          fieldData.getOptionLabel ? fieldData.getOptionLabel(option) : option[fieldData.labelProp]
                        }
                        isOptionEqualToValue={fieldData.isOptionEqualToValue}
                        name={fieldName}
                        label={fieldData.label}
                        onChange={(event, value) => {
                          // Handle both string and object values
                          const savedValue =
                            value === null ? "" : fieldData.getOptionValue ? fieldData.getOptionValue(value) : value;
                          handleInputChange(fieldName, savedValue);
                        }}
                      />
                    )}
                    <GLForm
                      formData={fieldData.fields}
                      state={fieldState}
                      onChange={newObjectState => {
                        onChange({
                          [fieldName]: { ...fieldState, ...newObjectState },
                        });
                      }}
                      loading={loading}
                    />
                  </Paper>
                );
              }
              case "array":
                return (
                  <GLArray
                    key={`${fieldName}-${fieldData.type}`}
                    fieldName={fieldName}
                    fieldState={fieldState}
                    fieldData={fieldData}
                    tabIndex={tabIndex}
                    setTabIndex={setTabIndex}
                    onChange={onChange}
                    loading={loading}
                    getEmptyObjectFromSchema={getEmptyObjectFromSchema}
                  />
                );

              case "color_picker":
                return (
                  <GLColorPicker
                    key={`${fieldName}-${fieldData.type}`}
                    fieldName={fieldName}
                    fieldState={fieldState}
                    fieldData={fieldData}
                    handleInputChange={handleInputChange}
                    state={state}
                  />
                );

              case "option_selector":
                return (
                  <GLOptionSelector
                    key={`${fieldName}-${fieldData.type}`}
                    fieldName={fieldName}
                    fieldData={fieldData}
                    value={fieldState}
                    onChange={value => handleInputChange(fieldName, value)}
                    classes={classes}
                    formErrors={formErrors}
                    index={index} // Pass the index here
                  />
                );

              default:
                return <div></div>;
            }
          }
        })}
    </>
  );
};

GLForm.defaultProps = {
  setFormErrors: () => {},
  formErrors: {},
  classes: {},
  loading: false,
  mode: "view",
  index: 0,
};

GLForm.propTypes = {
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  state: PropTypes.object.isRequired,
  loading: PropTypes.bool,
  formErrors: PropTypes.object,
  setFormErrors: PropTypes.func,
  classes: PropTypes.object,
  mode: PropTypes.string,
  index: PropTypes.number,
};

export default GLForm;
