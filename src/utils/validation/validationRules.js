// utils/validators/validationRules.js
import { validateEmail, validatePhoneNumber, validateRequired } from "./validationFunction";

export const allValidationRules = {
    name: {
        message: 'Please enter the Name',
        validate: validateRequired,
    },
    contactName: {
        message: 'Please enter the Contact Name',
        validate: validateRequired,
    },
    contactPerson: {
        message: 'Please enter select Contact Person',
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
    salesPerson: {
        message: 'Please Select Sales Person',
        validate: validateRequired,
    },
    priority: {
        message: 'Please Select Priority',
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
    customer: {
        message: 'Please select Customer ',
        validate: validateRequired,
    },
    opportunity: {
        message: 'Please select Opportunity',
        validate: validateRequired,
    },
    enquiryType: {
        message: 'Please select Enquiry Type',
        validate: validateRequired,
    },
    dateAndTime: {
        message: 'Please select Date and Time',
        validate: validateRequired,
    },
    siteLocation: {
        message: 'Please select Site Location',
        validate: validateRequired
    },
    visitPurpose: {
        message: 'Please select Purpose of Visit',
        validate: validateRequired
    },
    remarks: {
        message: 'Please enter remarks',
        validate: validateRequired,
    },
    box: {
        message: 'Please select box name',
        validate: validateRequired,
    },
    device: {
        message: 'Please Select Device Name',
        validate: validateRequired,
    },
    brand: {
        message: 'Please select Brand Name',
        validate: validateRequired,
    },
    consumerModel: {
        message: 'Please select Consumer Model',
        validate: validateRequired,
    },
    serialNumber: {
        message: 'Please select Serial Number',
        validate: validateRequired,
    },
    assignedTo: {
        message: 'Please select Assigned To',
        validate: validateRequired,
    },
    spareName: {
        message: 'Please select Spare Name',
        validate: validateRequired,
    }

    // Add other fields as needed
};
