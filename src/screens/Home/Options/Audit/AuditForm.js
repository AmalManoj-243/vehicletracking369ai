import { View, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { RoundedScrollContainer, SafeAreaView } from '@components/containers'
import { NavigationHeader } from '@components/Header'
import { TextInput as FormInput } from '@components/common/TextInput'
import { COLORS, FONT_FAMILY } from '@constants/theme'
import { Button } from '@components/common/Button'
import SignaturePad from '@components/SignaturePad'
import Text from '@components/Text'
import { fetchBills } from '@api/details/detailApi'

const AuditForm = ({ navigation }) => {

  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [url, setUrl] = useState('')
  const [customer, setCustomer] = useState({})
  const [collectionType, setCollectionType] = useState(null);
  console.log("🚀 ~ AuditForm ~ collectionType:", collectionType)
  console.log("🚀 ~ AuditForm ~ customer:", customer)


  // Function to handle scanned data
  const handleScan = async (data) => {

    const billParts = data.split('-')
    console.log("🚀 ~ handleScan ~ billParts:", billParts)
    const scannedBillName = billParts[0]
    const scannedBillSequence = billParts.slice(1).join('-')

    try {
      let response, customerData;
      // console.log("Response of customer data", customerData)
      switch (scannedBillName) {
        case "Invoice":
          response = await fetchBills.invoiceDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "Vendor Bill":
          response = await fetchBills.vendorDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Vendor bill customer data", customerData);
          break;

        case "Sales Return":
          response = await fetchBills.salesReturnDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "PURCHRET":
          response = await fetchBills.purchaseReturnDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "CAPREC":
          response = await fetchBills.capitalRecieptsDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "Cash rec":
          response = await fetchBills.cashReceiptsDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "Cash pay":
          response = await fetchBills.cashPaymentsDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "Bankpay":
          response = await fetchBills.expenseDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "Bank rec":
          response = await fetchBills.capitalRecieptsDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "CUSTREC":
          response = await fetchBills.customerReceiptsDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "CUSTPAY":
          response = await fetchBills.customerPaymentDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "SUPREC":
          response = await fetchBills.supplierRecieptsDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "SUPPAY":
          response = await fetchBills.supplierPaymentsDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "CAPPAY":
          response = await fetchBills.capitalPaymentDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "JobInvoice":
          response = await fetchBills.jobInvoiceDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "PETTYALLOT":
          response = await fetchBills.pettyCashAllotmentDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "PETEXP":
          response = await fetchBills.pettyCashExpenseDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "CASRET":
          response = await fetchBills.pettyCashReturnDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "PETTYTRANS":
          response = await fetchBills.pettyCashTransferDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        case "Spare Issue":
          response = await fetchBills.sparePartsIssueDetails(scannedBillSequence);
          customerData = response[0];
          console.log("Sales return customer data", customerData);
          break;

        default:
          console.log("Unknown bill type");
      }

      if (customerData) {
        const customerDetails = {
          customerName: customerData.customer.customer_name || customerData.supplier.supplier_name || customerData.capital_chart_of_account_name || customerData?.expense_chart_of_account_name || sales_person.sales_person_name || '',
          invoiceNumber: customerData.sequence_no || '',
          totalAmount: customerData.total_amount || '',
          businessType: customerData.bussiness_type_id || '',
          paymentMethod: customerData.payment_method_id || customerData.register_payments[0].payment_method_id || customerData.paid_through_chart_of_account_id || customerData?.transaction_type_id || '',
          ledgerId: customerData.capital_chart_of_account_id || customerData.expense_chart_of_account_id || customerData.ledger_id || '',
        };
        const collectionTypeResponse = await fetchBills.collectionTypeDetails(customerDetails.businessType, customerDetails.paymentMethod);
        console.log("🚀 ~ handleScan ~ collectionTypeResponse:", collectionTypeResponse)
        const collectionResponseData = collectionTypeResponse[0];
        setCollectionType(collectionResponseData);
        if (customerDetails.ledgerId) {
          const ledgerTypeResponse = await fetchBills.ledgerTypeDetails(customerDetails.ledgerId);
          const ledgerTypeResponseData = ledgerTypeResponse[0]?.auditing_ledger;
          setLedger(ledgerTypeResponseData);
        }
        setCustomer(customerDetails);
      }
      console.log("Customer:", customer);
    } catch (error) {
      console.log('Error fetching customer details:', error);
    }
  };

  return (
    <SafeAreaView>
      <NavigationHeader
        title="New Transaction Audit"
        onBackPress={() => navigation.goBack()}
      />
      <RoundedScrollContainer scrollEnabled={scrollEnabled}  >
        <FormInput label={'Date'} editable={false} />
        <FormInput label={'Branch'} editable={false} />
        <FormInput label={'Collection Type'} placeholder={'Collection Type'} editable={false} value={collectionType?.collection_type_name} />
        <View style={styles.dottedQrBorderContainer}>
          <FormInput label={'Customer'} placeholder={'Customer Name'} editable={false}  value={customer?.customerName?.toUpperCase() || ''} />
          <FormInput label={'Invoice Number'} placeholder={'Invoice no'} editable={false} value={customer?.invoiceNumber || ''} />
          <FormInput label={'Total Amount'} editable={false} placeholder={'Total Amount'} value={customer?.totalAmount?.toString()}/>
          <View style={styles.rowCotainer}>
            <Text style={styles.qrCodeText}>Update from qr Code </Text>
            <View style={styles.buttonContainer}>
              <Button backgroundColor={COLORS.primaryThemeColor} title={'Scan'} onPress={() => navigation.navigate('Scanner', { onScan: handleScan })} />
            </View>
          </View>
        </View>
        <SignaturePad setScrollEnabled={setScrollEnabled} setUrl={setUrl} title={'Customer/Vendor Signature'} />
        <FormInput label={'Remarks'} multiline={true} numberOfLines={5} />
        <Button backgroundColor={COLORS.primaryThemeColor} title={'SUBMIT'} />
      </RoundedScrollContainer>
    </SafeAreaView>
  )
}

export default AuditForm

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  dottedQrBorderContainer: {
    padding: 15,
    borderWidth: 1.3,
    borderColor: COLORS.primaryThemeColor,
    borderRadius: 18,
    borderStyle: 'dotted',
    marginVertical: 10
  },
  rowCotainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  buttonContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  qrCodeText: {
    fontFamily: FONT_FAMILY.urbanistSemiBold,
    fontSize: 16,
    color: COLORS.primaryThemeColor,
    flex: 2,
  },

});

