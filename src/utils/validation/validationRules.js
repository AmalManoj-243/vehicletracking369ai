// utils/validators/validationRules.js
import { validateEmail, validatePhoneNumber, validateRequired } from "./validationFunction";

export const allValidationRules = {
    name: {
        message: 'Please enter the Name',
        validate: validateRequired,
    },
    address: {
        message: 'Please enter the Address',
        validate: validateRequired,
    },
    phoneNumber: {
        message: 'Please enter a valid phone number',
        validate: value => validateRequired(value) && validatePhoneNumber(value),
    },
    emailAddress: {
        message: 'Please enter a valid email address',
        validate: value => validateRequired(value) && validateEmail(value),
    },
    source: {
        message: 'Please select the Source',
        validate: validateRequired,
    },
    customerTypes: {
        message: 'Please select Customer Types',
        validate: validateRequired,
    },
    customerName: {
        message: 'Please select Customer Name',
        validate: validateRequired,
    },
    customerTitles: {
        message: 'Please select Customer Types',
        validate: validateRequired,
    },
    modeOfPayment: {
        message: 'Please select Mode Of Payment',
        validate: validateRequired,
    },
    // Add other fields as needed
};
