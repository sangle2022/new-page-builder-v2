/* global grecaptcha */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";

// Dummy OTP. The SMS gateway is deliberately NOT called: the form accepts this
// fixed code, which is how OTP worked in this app before the live-version OTP
// API was wired in. To go back to real OTP, restore the axios calls to
// /server/verification/otp/{generate,validate,regenerate}.
const DUMMY_OTP = "123456";

// ─── Utility: font style shared across inputs ───
const inputFontStyle = {
  fontFamily: "'Segoe UI', 'Segoe WP', Tahoma, Arial, sans-serif",
  fontWeight: 500,
  fontSize: "small",
};

// ─── Unified error message strings ───
const REQUIRED_MSG = "This field is required";
const VALIDATION_MSG = "This validation is required before proceeding";

// ─── Sub-component: individual field renderer ───
const FormField = ({
  field,
  value,
  onChange,
  formDisabled,
  errorMessage,
  onGetOTP,
  onSubmitOtp,
  onResendOTP,
  otpState,
  onFetchAddress,
  multiSelectOpen,
  onToggleMultiSelect,
  onRemoveMultiSelectValue,
  pincodeLookupData,
  onPincodeAreaChange,
  clearPincodeDerivedData,
  areaErrorMessage,
}) => {
  const isRequired = field.required === "yes";
  const hasError = !!errorMessage;
  const errorBorderClass = hasError ? "border-red-500 ring-2 ring-red-500" : "";
  const errorRingClass = hasError ? "ring-2 ring-red-500" : "";

  const renderError = () =>
    errorMessage ? (
      <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
    ) : null;

  const renderLabel = () => {
    if (field.type === "captcha" || field.type === "loanProduct") return null;
    return (
      <label className="block text-gray-700 mb-2" style={inputFontStyle}>
        {field.name}
        {isRequired && (
          <span style={{ color: "#bc2f32", marginLeft: "4px" }}>*</span>
        )}
      </label>
    );
  };

  const renderInput = () => {
    switch (field.type) {
      case "loanProduct":
        return null;

      case "amountValidator":
        return (
          <div>
            <input
              style={inputFontStyle}
              type="number"
              name={field.name}
              placeholder="Enter Amount"
              value={value || ""}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 ${errorBorderClass}`}
              required={isRequired}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={formDisabled}
            />
            {renderError()}
          </div>
        );

      case "captcha":
        if (field.captchaValidation !== "yes") return null;
        return (
          <div>
            {renderError()}
            <div className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300">
              <div
                className="g-recaptcha"
                data-sitekey={sessionStorage.getItem("site-key")}
              />
            </div>
          </div>
        );

      case "radio":
        return (
          <>
            <div className="flex flex-col">
              {field.options.map((option, index) => (
                <label
                  key={index}
                  className="inline-flex items-center"
                  style={{ ...inputFontStyle }}
                >
                  <input
                    style={inputFontStyle}
                    type="radio"
                    name={field.name}
                    value={option}
                    className={`form-radio text-blue-600 ${errorRingClass}`}
                    checked={value === option}
                    onChange={() => onChange(field.name, option)}
                    disabled={formDisabled}
                  />
                  <span className="ml-2">{option}</span>
                </label>
              ))}
            </div>
            {renderError()}
          </>
        );

      case "text":
        return (
          <>
            <input
              style={inputFontStyle}
              type="text"
              name={field.name}
              placeholder={`Enter your ${field.name}`}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 ${errorBorderClass}`}
              required={isRequired}
              value={value || ""}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                onChange(field.name, cleaned);
              }}
              disabled={formDisabled}
            />
            {renderError()}
          </>
        );

      case "date": {
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 55, 0, 1)
          .toISOString()
          .split("T")[0];
        const maxDate = new Date(today.getFullYear() - 24, 11, 31)
          .toISOString()
          .split("T")[0];
        return (
          <>
            <input
              type="date"
              style={inputFontStyle}
              name={field.name}
              placeholder={`Enter your ${field.name}`}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 ${errorBorderClass}`}
              required={isRequired}
              min={minDate}
              max={maxDate}
              value={value || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              onKeyDown={(e) => e.preventDefault()}
              disabled={formDisabled}
            />
            {renderError()}
          </>
        );
      }

      case "number":
        return (
          <>
            <input
              style={inputFontStyle}
              type="text"
              name={field.name}
              placeholder={`Enter your ${field.name}`}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 ${errorBorderClass}`}
              required={isRequired}
              maxLength={field.digits || undefined}
              value={value || ""}
              onChange={(e) => {
                let cleaned = e.target.value.replace(/[^0-9]/g, "");
                if (field.digits) cleaned = cleaned.slice(0, field.digits);
                onChange(field.name, cleaned);
              }}
              disabled={formDisabled}
            />
            {renderError()}
          </>
        );

      case "email":
        return (
          <>
            <input
              style={inputFontStyle}
              type="email"
              name={field.name}
              placeholder={`Enter your ${field.name}`}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 ${errorBorderClass}`}
              required={isRequired}
              value={value || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={formDisabled}
            />
            {renderError()}
          </>
        );

      case "phone":
        return (
          <>
            {field.otpValidation === "yes" ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  name={field.name}
                  minLength="10"
                  maxLength="10"
                  placeholder={`Enter your ${field.name}`}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 ${errorBorderClass}`}
                  required={isRequired}
                  value={value || ""}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, "");
                    onChange(field.name, cleaned);
                  }}
                  readOnly={otpState.phoneLocked}
                  style={{
                    ...inputFontStyle,
                    cursor: otpState.phoneLocked ? "not-allowed" : "text",
                  }}
                  disabled={otpState.phoneDisabled || formDisabled}
                />
                {!otpState.otpSent && !otpState.otpVerified && (
                  <button
                    type="button"
                    style={{ height: "40px", backgroundColor: "#144897" }}
                    onClick={() => onGetOTP(field.name, field.step)}
                    className="px-4 bg-yellow-500 text-white rounded text-xs whitespace-nowrap"
                    disabled={formDisabled || otpState.otpLoading}
                  >
                    {otpState.otpLoading ? (
                      <div
                        className="spinner-border spinner-border-sm text-white"
                        role="status"
                      />
                    ) : (
                      <span>Get OTP</span>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <input
                type="text"
                style={inputFontStyle}
                name={field.name}
                minLength="10"
                maxLength="10"
                placeholder={`Enter your ${field.name}`}
                className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 ${errorBorderClass}`}
                required={isRequired}
                value={value || ""}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, "");
                  onChange(field.name, cleaned);
                }}
                disabled={formDisabled}
              />
            )}
            {renderError()}

            {field.otpValidation === "yes" &&
              otpState.otpSent &&
              !otpState.otpVerified && (
                <div className="mt-4">
                  <input
                    type="text"
                    style={inputFontStyle}
                    name="OTP"
                    placeholder="Enter OTP"
                    className="px-2 py-1 border rounded w-full"
                    value={otpState.otpValue}
                    onChange={(e) => otpState.setOtpValue(e.target.value)}
                  />
                  {otpState.timerValue > 0 && (
                    <div className="text-gray-500 text-sm mt-1">
                      00:{otpState.timerValue.toString().padStart(2, "0")}
                    </div>
                  )}
                  <div className="flex justify-center items-center mt-4 space-x-4">
                    <button
                      type="button"
                      onClick={() => onSubmitOtp(field.name, field.step)}
                      className="px-4 py-2 bg-green-500 text-white rounded"
                      disabled={otpState.submitOtpLoading}
                    >
                      {otpState.submitOtpLoading ? (
                        <div
                          className="spinner-border spinner-border-sm text-white"
                          role="status"
                        />
                      ) : (
                        <span>Submit OTP</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onResendOTP(field.step, field.name)}
                      className={`px-4 py-2 text-white rounded ${
                        otpState.canResend ? "bg-blue-500" : "bg-gray-500"
                      }`}
                      style={{
                        cursor: otpState.canResend ? "pointer" : "not-allowed",
                      }}
                      disabled={!otpState.canResend || otpState.resendLoading}
                    >
                      {otpState.resendLoading ? (
                        <div
                          className="spinner-border spinner-border-sm text-white"
                          role="status"
                        />
                      ) : (
                        <span>Resend OTP</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

            {otpState.otpVerified && (
              <div className="mt-2 text-green-500 text-sm">
                OTP validated successfully! You can proceed to the next step.
              </div>
            )}

            {otpState.otpMessage && !otpState.otpVerified && (
              <div className="mt-2 text-sm">
                <p
                  className={
                    otpState.otpMessageType === "success"
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {otpState.otpMessage}
                </p>
              </div>
            )}
          </>
        );

      case "dropdown":
        return (
          <>
            <select
              name={field.name}
              required={isRequired}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 ${errorBorderClass}`}
              disabled={formDisabled}
              value={value || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
            >
              <option value="" disabled>
                -- Select {field.name} --
              </option>
              {field.options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {renderError()}
          </>
        );

      case "multiSelect": {
        const selectedValues = value
          ? value
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [];
        return (
          <>
            <div className="multi-select-wrapper">
              <div
                className="multi-select-display w-full px-3 py-2 border rounded"
                onClick={() => onToggleMultiSelect(field.name)}
                tabIndex="0"
                style={{
                  minHeight: "42px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  alignItems: "center",
                  cursor: "pointer",
                  backgroundColor: "#fff",
                  border: hasError ? "1px solid #ef4444" : "1px solid #d1d5db",
                  boxShadow: hasError
                    ? "0 0 0 2px rgba(239, 68, 68, 0.3)"
                    : "none",
                  ...inputFontStyle,
                  boxSizing: "border-box",
                }}
              >
                {selectedValues.length === 0 ? (
                  <span className="multi-select-placeholder text-gray-400">
                    Select {field.name}
                  </span>
                ) : (
                  selectedValues.map((val, i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#f3f4f6",
                        borderRadius: "16px",
                        padding: "4px 10px",
                        fontSize: "13px",
                      }}
                    >
                      {val}
                      <span
                        style={{
                          cursor: "pointer",
                          fontWeight: "bold",
                          color: "#144897",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveMultiSelectValue(field.name, val);
                        }}
                      >
                        ×
                      </span>
                    </span>
                  ))
                )}
              </div>

              {multiSelectOpen === field.name && (
                <div
                  className="multi-select-dropdown border rounded mt-1 bg-white"
                  style={{
                    maxHeight: "180px",
                    overflowY: "auto",
                    position: "relative",
                    zIndex: 999,
                  }}
                >
                  {field.options.map((option, index) => (
                    <label
                      key={index}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      style={{ margin: 0 }}
                    >
                      <input
                        type="checkbox"
                        value={option}
                        className="mr-2"
                        checked={selectedValues.includes(option)}
                        onChange={() => {
                          let newValues;
                          if (selectedValues.includes(option)) {
                            newValues = selectedValues.filter(
                              (v) => v !== option,
                            );
                          } else {
                            newValues = [...selectedValues, option];
                          }
                          onChange(field.name, newValues.join(","));
                        }}
                        disabled={formDisabled}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {renderError()}
          </>
        );
      }

      case "pincode": {
        const pincodeConfig = Array.isArray(field.pincodeFields)
          ? field.pincodeFields
          : [];

        const showAreaName =
          pincodeConfig.includes("areaName") ||
          pincodeConfig.includes("areaname");
        const showCity = pincodeConfig.includes("city");
        const showState = pincodeConfig.includes("state");
        const showCountry = pincodeConfig.includes("country");

        const lookupData = pincodeLookupData?.[field.name] || {
          areas: [],
          selectedArea: "",
          city: "",
          state: "",
          country: "",
        };

        return (
          <>
            <input
              placeholder="Enter Your Pincode"
              type="text"
              style={inputFontStyle}
              name={field.name}
              required={isRequired}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 ${errorBorderClass}`}
              value={value || ""}
              onChange={(e) => {
                const cleaned = e.target.value
                  .replace(/[^0-9]/g, "")
                  .slice(0, 6);
                onChange(field.name, cleaned);
                clearPincodeDerivedData(field);
                if (cleaned.length === 6) {
                  onFetchAddress(field, cleaned);
                }
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (val.length === 6) {
                  onFetchAddress(field, val);
                }
              }}
              disabled={formDisabled}
            />
            {renderError()}

            {(showAreaName || showCity || showState || showCountry) && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {showAreaName && (
                  <div>
                    <label
                      className="block text-gray-700 mb-2"
                      style={inputFontStyle}
                    >
                      Area Name
                    </label>
                    <select
                      className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 ${
                        areaErrorMessage
                          ? "border-red-500 ring-2 ring-red-500"
                          : ""
                      }`}
                      value={lookupData.selectedArea || ""}
                      onChange={(e) =>
                        onPincodeAreaChange(field, e.target.value)
                      }
                      disabled={formDisabled || !lookupData.areas?.length}
                      style={inputFontStyle}
                    >
                      <option value="" disabled>
                        -- Select Area Name --
                      </option>
                      {lookupData.areas?.map((area, index) => (
                        <option key={`${area}-${index}`} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                    {areaErrorMessage && (
                      <div className="text-red-500 text-sm mt-2">
                        {areaErrorMessage}
                      </div>
                    )}
                  </div>
                )}

                {showCity && (
                  <div>
                    <label
                      className="block text-gray-700 mb-2"
                      style={inputFontStyle}
                    >
                      City
                    </label>
                    <input
                      type="text"
                      value={lookupData.city || ""}
                      readOnly
                      className="w-full px-3 py-2 border rounded bg-gray-100"
                      style={inputFontStyle}
                    />
                  </div>
                )}

                {showState && (
                  <div>
                    <label
                      className="block text-gray-700 mb-2"
                      style={inputFontStyle}
                    >
                      State
                    </label>
                    <input
                      type="text"
                      value={lookupData.state || ""}
                      readOnly
                      className="w-full px-3 py-2 border rounded bg-gray-100"
                      style={inputFontStyle}
                    />
                  </div>
                )}

                {showCountry && (
                  <div>
                    <label
                      className="block text-gray-700 mb-2"
                      style={inputFontStyle}
                    >
                      Country
                    </label>
                    <input
                      type="text"
                      value={lookupData.country || ""}
                      readOnly
                      className="w-full px-3 py-2 border rounded bg-gray-100"
                      style={inputFontStyle}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        );
      }

      default:
        return (
          <>
            <input
              type="text"
              style={inputFontStyle}
              name={field.name}
              required={isRequired}
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 ${errorBorderClass}`}
              value={value || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={formDisabled}
            />
            {renderError()}
          </>
        );
    }
  };

  return (
    <>
      {renderLabel()}
      {renderInput()}
    </>
  );
};

// ─── Main DynamicForm component ───
const DynamicForm = ({
  formMetadata,
  captureleadapi,
  mapFormDataToJson,
  trackMetaLead,
  loadRecaptchaScript,
  onSubmitSuccess,
}) => {
  // ─── State ───
  const [currentStep, setCurrentStep] = useState(1);
  const [formValues, setFormValues] = useState({});
  // Unified error state. Keys:
  //   - field.name         → inline error for that field
  //   - "__captcha"        → captcha validation error
  //   - "__authorize"      → authorize-checkbox error
  // Values are the exact message strings to display.
  const [fieldErrors, setFieldErrors] = useState({});
  const [authorizeChecked, setAuthorizeChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [multiSelectOpen, setMultiSelectOpen] = useState(null);
  const [pincodeLookupData, setPincodeLookupData] = useState({});

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [submitOtpLoading, setSubmitOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpMessageType, setOtpMessageType] = useState("error");
  const [timerValue, setTimerValue] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [phoneLocked, setPhoneLocked] = useState(false);
  const [phoneDisabled, setPhoneDisabled] = useState(false);

  // Button loading
  const [nextLoading, setNextLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const timerRef = useRef(null);
  const formRef = useRef(null);

  // ─── Derived data ───
  const groupedByStep = useMemo(() => {
    return formMetadata.reduce((acc, field) => {
      acc[field.step] = acc[field.step] || [];
      acc[field.step].push(field);
      return acc;
    }, {});
  }, [formMetadata]);

  const totalSteps = useMemo(
    () => Object.keys(groupedByStep).length,
    [groupedByStep],
  );

  // ─── Auto-clear ALL error messages 3s after they are set ───
  // Any new setFieldErrors call restarts the timer (via the dep change).
  useEffect(() => {
    if (Object.keys(fieldErrors).length === 0) return;
    const t = setTimeout(() => setFieldErrors({}), 3000);
    return () => clearTimeout(t);
  }, [fieldErrors]);

  // ─── Set validation variables in sessionStorage (same as original) ───
  useEffect(() => {
    // Clear any stale leadId from a previous (abandoned) session.
    // This effect runs only on a real mount — i.e. fresh page load / refresh —
    // so mid-flow step navigation is unaffected. Without this, a user who
    // completes step 1 (creating a lead), then refreshes, would reuse the old
    // leadId and update that record instead of creating a new one.
    sessionStorage.removeItem("leadId");

    sessionStorage.removeItem("phoneVal");
    sessionStorage.removeItem("pincodeVal");
    sessionStorage.removeItem("captchaVal");
    sessionStorage.removeItem("amountVal");

    formMetadata.forEach((field) => {
      switch (field.type) {
        case "amountValidator":
          sessionStorage.setItem(
            "amountVal",
            JSON.stringify({
              step: field.step,
              validation: true,
              minValue: field.minValue,
              maxValue: field.maxValue,
            }),
          );
          break;
        case "phone":
          sessionStorage.setItem(
            "phoneVal",
            JSON.stringify({
              step: field.step,
              validation: field.otpValidation === "yes",
            }),
          );
          if (field.otpValidation === "yes") {
            sessionStorage.setItem("otpVarified", true);
          } else {
            sessionStorage.setItem("otpVarified", false);
            sessionStorage.setItem("JsonOTP", false);
          }
          break;
        case "pincode":
          sessionStorage.setItem(
            "pincodeVal",
            JSON.stringify({ step: field.step, validation: true }),
          );
          break;
        case "captcha":
          sessionStorage.setItem(
            "captchaVal",
            JSON.stringify({
              step: field.step,
              validation: field.captchaValidation === "yes",
            }),
          );
          break;
        case "loanProduct":
          sessionStorage.setItem("loanProduct", field.loanProductType);
          sessionStorage.setItem("loanproductname", field.name);
          break;
        default:
          break;
      }
    });
  }, [formMetadata]);

  // ─── Re-render captcha when step changes ───
  useEffect(() => {
    if (typeof grecaptcha !== "undefined" && grecaptcha.render) {
      setTimeout(() => {
        const captchaContainers =
          document.querySelectorAll(".g-recaptcha:empty");
        captchaContainers.forEach((container) => {
          try {
            grecaptcha.render(container, {
              sitekey: sessionStorage.getItem("site-key"),
            });
          } catch (e) {
            // already rendered
          }
        });
      }, 100);
    }
    loadRecaptchaScript();
  }, [currentStep, loadRecaptchaScript]);

  // ─── Close multi-select on outside click ───
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".multi-select-wrapper")) {
        setMultiSelectOpen(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // ─── Timer for OTP ───
  const startTimer = useCallback((seconds) => {
    setTimerValue(seconds);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerValue((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ─── Visibility rules ───
  const isFieldVisible = useCallback(
    (field) => {
      if (!field.visibilityRule) return true;

      const rule = field.visibilityRule;
      if (!rule.controllerFieldId) return true;

      const controllerField = formMetadata.find(
        (f) => f.id === rule.controllerFieldId,
      );
      if (!controllerField) return false;

      const controllerValue = formValues[controllerField.name] || "";

      const normalizedControllerValue = Array.isArray(controllerValue)
        ? controllerValue.map((val) => String(val).trim().toLowerCase())
        : typeof controllerValue === "string"
          ? controllerValue
              .split(",")
              .map((v) => v.trim().toLowerCase())
              .filter(Boolean)
          : [
              String(controllerValue || "")
                .trim()
                .toLowerCase(),
            ];

      const normalizedRuleValue = String(rule.controllerValue || "")
        .trim()
        .toLowerCase();

      const isMatched = normalizedControllerValue.includes(normalizedRuleValue);

      if (rule.action === "show") return isMatched;
      if (rule.action === "hide") return !isMatched;
      return true;
    },
    [formMetadata, formValues],
  );

  // ─── Clear hidden field values ───
  useEffect(() => {
    const newValues = { ...formValues };
    let changed = false;
    formMetadata.forEach((field) => {
      if (!isFieldVisible(field) && formValues[field.name]) {
        newValues[field.name] = "";
        changed = true;
      }
    });
    if (changed) {
      setFormValues(newValues);
    }
  }, [formMetadata, isFieldVisible]);

  // ─── Field change handler ───
  const handleFieldChange = useCallback((fieldName, value) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
    // Clear that specific field's error so the border/message disappears
    // as soon as the user starts typing again.
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const { [fieldName]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // ─── Pincode helpers ───
  const handlePincodeAreaChange = useCallback((field, selectedArea) => {
    setPincodeLookupData((prev) => {
      const currentFieldData = prev[field.name] || {};
      const matchedRecord =
        (currentFieldData.records || []).find(
          (item) => item.area_name === selectedArea,
        ) || {};

      return {
        ...prev,
        [field.name]: {
          ...currentFieldData,
          selectedArea,
          city: matchedRecord.city || currentFieldData.city || "",
          state: matchedRecord.state || currentFieldData.state || "",
          country: matchedRecord.country || currentFieldData.country || "",
        },
      };
    });

    // User picked a real area → clear the pincode step-level block so Next works.
    if (selectedArea) {
      sessionStorage.setItem(
        "pincodeVal",
        JSON.stringify({ step: field.step, validation: false }),
      );
      setFieldErrors((prev) => {
        const areaKey = `${field.name}__area`;
        if (!prev[field.name] && !prev[areaKey]) return prev;
        const { [field.name]: _a, [areaKey]: _b, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  const clearPincodeDerivedData = useCallback((field) => {
    setPincodeLookupData((prev) => ({
      ...prev,
      [field.name]: {
        records: [],
        areas: [],
        selectedArea: "",
        city: "",
        state: "",
        country: "",
      },
    }));

    sessionStorage.setItem(
      "pincodeVal",
      JSON.stringify({ step: field.step, validation: true }),
    );
  }, []);

  // ─── Collect visible step data ───
  const collectVisibleStepData = useCallback(
    (step) => {
      const formData = {};
      const stepFields = groupedByStep[step] || [];

      stepFields.forEach((field) => {
        if (!isFieldVisible(field)) return;
        if (field.type === "captcha" || field.type === "loanProduct") return;

        const val = formValues[field.name];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          formData[field.name] = val;
        } else {
          // Field was visible on this step but left empty by the user.
          // Still emit the key (empty string) so the backend record preserves
          // the field's existence — otherwise it looks like the field never
          // existed on the form when viewed later in the leads table.
          formData[field.name] = "";
        }

        if (field.type === "pincode") {
          const pincodeConfig = Array.isArray(field.pincodeFields)
            ? field.pincodeFields
            : [];

          const showAreaName =
            pincodeConfig.includes("areaName") ||
            pincodeConfig.includes("areaname");

          const lookupData = pincodeLookupData[field.name] || {};

          if (showAreaName && lookupData.selectedArea) {
            formData.areaName = lookupData.selectedArea;
          }
          if (pincodeConfig.includes("city") && lookupData.city) {
            formData.city = lookupData.city;
          }
          if (pincodeConfig.includes("state") && lookupData.state) {
            formData.state = lookupData.state;
          }
          if (pincodeConfig.includes("country") && lookupData.country) {
            formData.country = lookupData.country;
          }
        }
      });

      if (step == totalSteps && authorizeChecked) {
        formData["authorizeCheckbox"] = "on";
      }

      // Include OTP value when a phone field with otpValidation exists on this step
      const phoneFieldWithOtp = stepFields.find(
        (f) =>
          f.type === "phone" && f.otpValidation === "yes" && isFieldVisible(f),
      );
      if (phoneFieldWithOtp && otpValue) {
        formData["OTP"] = otpValue;
      }

      return formData;
    },
    [
      groupedByStep,
      formValues,
      isFieldVisible,
      totalSteps,
      authorizeChecked,
      otpValue,
      pincodeLookupData,
    ],
  );

  // ─── Validate "required" & format rules for visible fields on a step ───
  const validateStepFields = useCallback(
    (step) => {
      const stepFields = groupedByStep[step] || [];
      let allValid = true;
      let firstInvalidRef = null;
      const newErrors = {};

      stepFields.forEach((field) => {
        if (!isFieldVisible(field)) return;
        if (field.type === "captcha" || field.type === "loanProduct") return;

        const isRequired = field.required === "yes";
        const val = formValues[field.name];

        if (field.type === "radio") {
          if (isRequired && !val) {
            allValid = false;
            newErrors[field.name] = REQUIRED_MSG;
            if (!firstInvalidRef) firstInvalidRef = field.name;
          }
          return;
        }

        if (field.type === "multiSelect") {
          const selectedValues = val
            ? val
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            : [];
          if (isRequired && selectedValues.length === 0) {
            allValid = false;
            newErrors[field.name] = REQUIRED_MSG;
            if (!firstInvalidRef) firstInvalidRef = field.name;
          }
          return;
        }

        const value = val ? String(val).trim() : "";

        if (isRequired && !value) {
          allValid = false;
          newErrors[field.name] = REQUIRED_MSG;
          if (!firstInvalidRef) firstInvalidRef = field.name;
          return;
        }

        if (field.type === "email" && value) {
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(value)) {
            allValid = false;
            newErrors[field.name] = "Please enter a valid email address";
            if (!firstInvalidRef) firstInvalidRef = field.name;
          }
        }

        if (field.type === "phone" && value) {
          if (value.length < 10) {
            allValid = false;
            newErrors[field.name] = "Phone number must be exactly 10 digits";
            if (!firstInvalidRef) firstInvalidRef = field.name;
          }
        }
      });

      // Authorize checkbox on final step
      if (step == totalSteps && !authorizeChecked) {
        allValid = false;
        newErrors.__authorize = "Please authorize before proceeding";
      }

      if (Object.keys(newErrors).length > 0) {
        // Merge on top of any existing errors (e.g. from special-field validation)
        setFieldErrors((prev) => ({ ...prev, ...newErrors }));
      }

      // Scrolling is handled centrally by scrollToFirstInvalid() in the
      // Next/Submit handlers so it also covers special-field errors
      // (pincode area, captcha, amount, OTP).
      return allValid;
    },
    [groupedByStep, formValues, isFieldVisible, totalSteps, authorizeChecked],
  );

  // ─── Scroll to the first field in the current step that has an error ───
  const scrollToFirstInvalid = useCallback((step) => {
    // Defer so the just-set fieldErrors have flushed into the DOM
    setTimeout(() => {
      const stepEl = formRef.current?.querySelector(`[data-step="${step}"]`);
      if (!stepEl) return;

      // Find the first visible element carrying an error indicator.
      // Covers: red-border inputs, red-text error messages, and the
      // authorize-checkbox message block.
      const invalid = stepEl.querySelector(
        ".border-red-500, [aria-invalid='true'], .text-red-500",
      );
      if (!invalid) return;

      const target = invalid.closest(".form-field") || invalid;
      target.scrollIntoView({ behavior: "smooth", block: "center" });

      // Focus the nearest input/select for accessibility, if available.
      const focusable = target.querySelector("input, select, textarea");
      if (focusable && typeof focusable.focus === "function") {
        try {
          focusable.focus({ preventScroll: true });
        } catch (_) {
          focusable.focus();
        }
      }
    }, 60);
  }, []);

  // ─── Validate captcha / phone-OTP / pincode / amount on a step ───
  const validateSpecialFields = useCallback(
    (step) => {
      let validationRequired = false;
      const stepFields = groupedByStep[step] || [];
      const newErrors = {};

      // Captcha
      const captchaState = JSON.parse(
        sessionStorage.getItem("captchaVal") || "null",
      );
      const hasCaptchaField = stepFields.some(
        (f) => f.type === "captcha" && isFieldVisible(f),
      );
      if (
        hasCaptchaField &&
        captchaState?.step == step &&
        captchaState.validation === true
      ) {
        const captchaCompleted =
          typeof grecaptcha !== "undefined" &&
          grecaptcha.getResponse &&
          grecaptcha.getResponse() !== "";
        if (!captchaCompleted) {
          validationRequired = true;
          newErrors.__captcha = VALIDATION_MSG;
        } else {
          sessionStorage.setItem(
            "captchaVal",
            JSON.stringify({ step, validation: false }),
          );
        }
      }

      // Phone OTP
      const phoneState = JSON.parse(
        sessionStorage.getItem("phoneVal") || "null",
      );
      const phoneField = stepFields.find(
        (f) => f.type === "phone" && isFieldVisible(f),
      );
      if (phoneField && phoneState?.step == step && phoneState.validation) {
        validationRequired = true;
        newErrors[phoneField.name] = VALIDATION_MSG;
      }

      // Pincode
      const pincodeField = stepFields.find(
        (f) => f.type === "pincode" && isFieldVisible(f),
      );
      if (pincodeField) {
        const pincodeVal = (formValues[pincodeField.name] || "").trim();
        const pincodeConfig = Array.isArray(pincodeField.pincodeFields)
          ? pincodeField.pincodeFields
          : [];
        const needsAreaName =
          pincodeConfig.includes("areaName") ||
          pincodeConfig.includes("areaname");
        const lookup = pincodeLookupData[pincodeField.name] || {};
        const areasAvailable = (lookup.areas || []).length > 0;
        const areaPicked = !!lookup.selectedArea;

        if (needsAreaName && areasAvailable && !areaPicked) {
          // Pincode fetched successfully and areas exist → user must pick one.
          // Error is attached to a separate key so it renders under the Area
          // dropdown, not under the pincode input.
          validationRequired = true;
          newErrors[`${pincodeField.name}__area`] =
            "Area name is mandatory — please select one";
        } else {
          // Fall back to the existing sessionStorage flag for the
          // "pincode not entered / fetch failed" case.
          const pincodeState = JSON.parse(
            sessionStorage.getItem("pincodeVal") || "null",
          );
          if (
            pincodeState?.step == step &&
            pincodeState.validation &&
            (!areasAvailable || !pincodeVal)
          ) {
            validationRequired = true;
            newErrors[pincodeField.name] = VALIDATION_MSG;
          }
        }
      }

      // Amount
      const amountState = JSON.parse(
        sessionStorage.getItem("amountVal") || "null",
      );
      const amountField = stepFields.find(
        (f) => f.type === "amountValidator" && isFieldVisible(f),
      );
      if (amountField && amountState?.step == step) {
        const enteredAmount = parseFloat(formValues[amountField.name] || "");
        if (
          enteredAmount < amountState.minValue ||
          enteredAmount > amountState.maxValue
        ) {
          validationRequired = true;
          newErrors[amountField.name] =
            `Value should be between ${amountState.minValue} and ${amountState.maxValue}`;
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...newErrors }));
      }
      return !validationRequired;
    },
    [groupedByStep, isFieldVisible, formValues, pincodeLookupData],
  );

  // ─── Fetch address for pincode ───
  const fetchAddress = useCallback(
    async (field, pincode) => {
      try {
        const response = await axios.get(
          `/server/migration/pincode/${pincode}`,
        );

        const apiData = response?.data;
        const records = Array.isArray(apiData?.data) ? apiData.data : [];

        if (apiData?.success && records.length > 0) {
          const uniqueAreas = [
            ...new Set(
              records
                .map((item) => String(item?.area_name || "").trim())
                .filter(Boolean),
            ),
          ];

          const firstRecord = records[0] || {};

          // Does this pincode field ask the user to pick an Area Name?
          const pincodeConfig = Array.isArray(field.pincodeFields)
            ? field.pincodeFields
            : [];
          const showAreaName =
            pincodeConfig.includes("areaName") ||
            pincodeConfig.includes("areaname");

          setPincodeLookupData((prev) => ({
            ...prev,
            [field.name]: {
              records,
              areas: uniqueAreas,
              // Do NOT auto-select the first area — user must choose it.
              selectedArea: "",
              city: firstRecord.city || "",
              state: firstRecord.state || "",
              country: firstRecord.country || "",
            },
          }));

          // Only treat Area Name as mandatory when it's configured AND
          // the lookup actually returned one or more areas to choose from.
          // If no areas came back, don't block the step.
          const areaRequired = showAreaName && uniqueAreas.length > 0;
          sessionStorage.setItem(
            "pincodeVal",
            JSON.stringify({
              step: field.step,
              validation: areaRequired,
              reason: areaRequired ? "area" : null,
            }),
          );

          // Clear any existing pincode error
          setFieldErrors((prev) => {
            if (!prev[field.name]) return prev;
            const { [field.name]: _removed, ...rest } = prev;
            return rest;
          });
        } else {
          clearPincodeDerivedData(field);
          setFieldErrors((prev) => ({
            ...prev,
            [field.name]: "Please enter a valid pincode",
          }));
        }
      } catch (error) {
        clearPincodeDerivedData(field);
        setFieldErrors((prev) => ({
          ...prev,
          [field.name]: "Please enter a valid pincode",
        }));
        console.error("Error fetching address:", error);
      }
    },
    [clearPincodeDerivedData],
  );

  // ─── OTP: Get OTP (dummy) ───
  const handleGetOTP = useCallback(
    (fieldName, step) => {
      const mobileNumber = formValues[fieldName] || "";
      setOtpMessage("");

      if (!/^\d{10}$/.test(mobileNumber)) {
        setOtpMessage("Please enter a valid 10-digit mobile number.");
        setOtpMessageType("error");
        return;
      }

      setOtpLoading(true);
      try {
        sessionStorage.setItem("dummyOTP", DUMMY_OTP);
        setOtpMessage(
          `OTP has been sent successfully. Use ${DUMMY_OTP} to continue.`,
        );
        setOtpMessageType("success");
        setPhoneLocked(true);
        setOtpSent(true);
        startTimer(30);
      } finally {
        setOtpLoading(false);
      }
    },
    [formValues, startTimer],
  );

  // ─── OTP: Submit OTP (dummy) ───
  const handleSubmitOtp = useCallback(
    (fieldName, step) => {
      setOtpMessage("");
      setSubmitOtpLoading(true);

      try {
        const expected = sessionStorage.getItem("dummyOTP") || DUMMY_OTP;

        if (otpValue !== expected) {
          setOtpMessage("Invalid OTP. Please try again.");
          setOtpMessageType("error");
          return;
        }

        // Same session flags the rest of the flow reads: JsonOTP is submitted
        // with the lead, and phoneVal unlocks the step's Next button.
        sessionStorage.setItem("otpVarified", false);
        sessionStorage.setItem("JsonOTP", true);
        sessionStorage.setItem(
          "phoneVal",
          JSON.stringify({ step, validation: false }),
        );
        setOtpVerified(true);
        setPhoneDisabled(true);
        setOtpMessage(
          "OTP validated successfully! You can proceed to the next step.",
        );
        setOtpMessageType("success");
      } finally {
        setSubmitOtpLoading(false);
      }
    },
    [otpValue],
  );

  // ─── OTP: Resend OTP (dummy) ───
  const handleResendOTP = useCallback(
    (step, fieldName) => {
      const mobileNumber = formValues[fieldName] || "";
      setOtpMessage("");

      if (!/^\d{10}$/.test(mobileNumber)) {
        setOtpMessage("Please enter a valid 10-digit mobile number.");
        setOtpMessageType("error");
        return;
      }

      setResendLoading(true);
      try {
        sessionStorage.setItem("dummyOTP", DUMMY_OTP);
        setOtpMessage(
          `OTP has been resent successfully. Use ${DUMMY_OTP} to continue.`,
        );
        setOtpMessageType("success");
        startTimer(30);
      } finally {
        setResendLoading(false);
      }
    },
    [formValues, startTimer],
  );

  // ─── Next step ───
  const handleNextStep = useCallback(
    async (step) => {
      const specialValid = validateSpecialFields(step);
      const isValid = validateStepFields(step);
      if (!specialValid || !isValid) {
        scrollToFirstInvalid(step);
        return;
      }

      const formData = collectVisibleStepData(step);
      let leadId = sessionStorage.getItem("leadId");
      if (leadId != null) {
        formData.leadId = leadId;
      }

      const jsonPayload = mapFormDataToJson(formData);

      try {
        setNextLoading(true);
        const response = await axios.post(captureleadapi, jsonPayload, {
          headers: { "Content-Type": "application/json" },
        });

        const data = response.data;
        leadId = sessionStorage.getItem("leadId");
        if (leadId == undefined && data?.leadId) {
          sessionStorage.setItem("leadId", data.leadId);
        }

        setCurrentStep(step + 1);
      } catch (error) {
        console.error("Error during API call:", error);
      } finally {
        setNextLoading(false);
      }
    },
    [
      validateSpecialFields,
      validateStepFields,
      collectVisibleStepData,
      mapFormDataToJson,
      captureleadapi,
      scrollToFirstInvalid,
    ],
  );

  // ─── Submit form ───
  const handleSubmitForm = useCallback(
    async (step) => {
      const specialValid = validateSpecialFields(step);
      const isValid = validateStepFields(step);
      if (!specialValid || !isValid) {
        scrollToFirstInvalid(step);
        return;
      }

      const formData = collectVisibleStepData(step);
      formData.leadId = sessionStorage.getItem("leadId");
      const jsonPayload = mapFormDataToJson(formData);

      try {
        setSubmitLoading(true);
        await axios.post(captureleadapi, jsonPayload, {
          headers: { "Content-Type": "application/json" },
        });

        sessionStorage.clear();
        setSubmitted(true);
        onSubmitSuccess?.();
        trackMetaLead();
      } catch (error) {
        console.error("Error during final submission:", error);
      } finally {
        setSubmitLoading(false);
      }
    },
    [
      validateSpecialFields,
      validateStepFields,
      collectVisibleStepData,
      mapFormDataToJson,
      captureleadapi,
      trackMetaLead,
      onSubmitSuccess,
    ],
  );

  // ─── Previous step ───
  const handlePrevStep = useCallback((step) => {
    setCurrentStep(step - 1);
  }, []);

  // ─── Amount validation on change ───
  const handleAmountChange = useCallback(
    (fieldName, value, minValue, maxValue) => {
      if (value === "" || isNaN(parseFloat(value))) {
        setFormValues((prev) => ({ ...prev, [fieldName]: value }));
        setFieldErrors((prev) => {
          if (!prev[fieldName]) return prev;
          const { [fieldName]: _removed, ...rest } = prev;
          return rest;
        });
        return;
      }

      const numVal = parseFloat(value);
      if (numVal > maxValue) return; // block input over max

      setFormValues((prev) => ({ ...prev, [fieldName]: value }));

      if (numVal < minValue) {
        setFieldErrors((prev) => ({
          ...prev,
          [fieldName]: `The value should be at least ${minValue} and should not exceed ${maxValue}`,
        }));
      } else {
        setFieldErrors((prev) => {
          if (!prev[fieldName]) return prev;
          const { [fieldName]: _removed, ...rest } = prev;
          return rest;
        });
      }
    },
    [],
  );

  // ─── Checkbox change ───
  const handleCheckboxChange = useCallback(() => {
    setAuthorizeChecked(true);
    setFieldErrors((prev) => {
      if (!prev.__authorize) return prev;
      const { __authorize: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // ─── Submitted state ───
  if (submitted) {
    return null;
  }
  // Our team will contact you soon.
  // ─── OTP state object to pass to FormField ───
  const otpStateObj = {
    otpSent,
    otpVerified,
    otpValue,
    setOtpValue,
    otpLoading,
    submitOtpLoading,
    resendLoading,
    otpMessage,
    otpMessageType,
    timerValue,
    canResend,
    phoneLocked,
    phoneDisabled,
  };

  // ─── Render ───
  return (
    <form
      className="container mt-4"
      ref={formRef}
      onSubmit={(e) => e.preventDefault()}
    >
      {Object.keys(groupedByStep).map((step) => {
        const stepNum = parseInt(step);
        const isCurrentStep = stepNum === currentStep;
        const stepFields = groupedByStep[step];

        return (
          <div
            key={step}
            className="form-step"
            data-step={step}
            style={{ display: isCurrentStep ? "block" : "none" }}
          >
            {stepFields.map((field, fieldIndex) => {
              const visible = isFieldVisible(field);
              if (field.type === "loanProduct") return null;

              const isCaptcha = field.type === "captcha";
              const errorMessage = isCaptcha
                ? fieldErrors.__captcha || ""
                : fieldErrors[field.name] || "";
              const areaErrorMessage =
                field.type === "pincode"
                  ? fieldErrors[`${field.name}__area`] || ""
                  : "";

              return (
                <div
                  key={field.id || `${step}-${fieldIndex}`}
                  className="form-field mb-4"
                  style={{ display: visible ? "block" : "none" }}
                >
                  <FormField
                    field={field}
                    value={formValues[field.name]}
                    onChange={
                      field.type === "amountValidator"
                        ? (name, val) =>
                            handleAmountChange(
                              name,
                              val,
                              field.minValue,
                              field.maxValue,
                            )
                        : handleFieldChange
                    }
                    formDisabled={false}
                    errorMessage={errorMessage}
                    areaErrorMessage={areaErrorMessage}
                    onGetOTP={handleGetOTP}
                    onSubmitOtp={handleSubmitOtp}
                    onResendOTP={handleResendOTP}
                    otpState={otpStateObj}
                    onFetchAddress={fetchAddress}
                    multiSelectOpen={multiSelectOpen}
                    onToggleMultiSelect={(name) =>
                      setMultiSelectOpen((prev) =>
                        prev === name ? null : name,
                      )
                    }
                    onRemoveMultiSelectValue={(name, val) => {
                      const current = formValues[name] || "";
                      const values = current
                        .split(",")
                        .map((v) => v.trim())
                        .filter((v) => v && v !== val);
                      handleFieldChange(name, values.join(","));
                    }}
                    pincodeLookupData={pincodeLookupData}
                    onPincodeAreaChange={handlePincodeAreaChange}
                    clearPincodeDerivedData={clearPincodeDerivedData}
                  />
                </div>
              );
            })}

            {/* Step navigation buttons */}
            <div
              className="mt-4 flex justify-center"
              style={{ display: "flex", gap: "20px" }}
            >
              {stepNum < totalSteps && totalSteps > 1 && (
                <>
                  {stepNum > 1 && (
                    <button
                      type="button"
                      onClick={() => handlePrevStep(stepNum)}
                      className="px-4 py-2 bg-gray-400 text-white rounded"
                      style={{ cursor: "pointer" }}
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleNextStep(stepNum)}
                    style={{ backgroundColor: "#144897", color: "white" }}
                    className="px-4 py-2 rounded bg-blue-300 text-white cursor-pointer"
                    disabled={nextLoading}
                  >
                    {nextLoading ? (
                      <div
                        className="spinner-border spinner-border-sm text-white"
                        role="status"
                      />
                    ) : (
                      <span>Next</span>
                    )}
                  </button>
                </>
              )}

              {stepNum == totalSteps && (
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "20px",
                    width: "100%",
                  }}
                >
                  <div style={{ textAlign: "left", marginBottom: "20px" }}>
                    <input
                      type="checkbox"
                      id="authorizeCheckbox2"
                      name="authorizeCheckbox"
                      required
                      className="mr-2 h-6 w-6"
                      checked={authorizeChecked}
                      onChange={handleCheckboxChange}
                      style={{
                        pointerEvents: authorizeChecked ? "none" : "auto",
                        cursor: authorizeChecked ? "default" : "pointer",
                        verticalAlign: "middle",
                        accentColor: authorizeChecked
                          ? "rgb(34 197 94)"
                          : "green",
                        appearance: "auto",
                      }}
                    />
                    <label
                      htmlFor="authorizeCheckbox2"
                      className="text-sm"
                      style={{
                        whiteSpace: "normal",
                        lineHeight: 1.5,
                        display: "inline",
                      }}
                    >
                      I authorise Fristine Infotech Ltd (FI) to contact me for
                      products and services offered by FI or any of its service
                      provider regarding marketing schemes, various other
                      financial and insurance products, etc. in any of the
                      following methods: (a)Telephone (b) E-mail (c) SMS (d)
                      WhatsApp
                    </label>
                    {fieldErrors.__authorize && (
                      <div
                        className="text-red-500 text-sm mt-2"
                        style={{ color: "red" }}
                      >
                        {fieldErrors.__authorize}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: "20px",
                      display: "flex",
                      justifyContent: "center",
                      gap: "20px",
                    }}
                  >
                    {totalSteps > 1 && (
                      <button
                        type="button"
                        onClick={() => handlePrevStep(stepNum)}
                        className="px-4 py-2 bg-gray-400 text-white rounded"
                        style={{ cursor: "pointer" }}
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSubmitForm(stepNum)}
                      style={{
                        padding: "12px 24px",
                        backgroundColor: "#144897",
                        color: "white",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "background-color 0.3s ease",
                      }}
                      disabled={submitLoading}
                    >
                      {submitLoading ? (
                        <div
                          className="spinner-border spinner-border-sm text-white"
                          role="status"
                        />
                      ) : (
                        <span>SUBMIT</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <style>{`.hide-display-bar::-webkit-scrollbar { display: none; }`}</style>
    </form>
  );
};

export default DynamicForm;
