import { View, Text } from 'react-native'
import React from 'react'
import { RoundedScrollContainer, SafeAreaView } from '@components/containers'
import { NavigationHeader } from '@components/Header'
import { DetailField } from '@components/common/Detail'

const VisitDetails = ({navigation}) => {
  return (
   <SafeAreaView>
      <NavigationHeader
        title="Customer Visits Details"
        logo={false}

        onBackPress={() => navigation.goBack()}
      />
      <RoundedScrollContainer>
        <DetailField
        label={'Date & Time'}
        />
         <DetailField
        label={'Customer Name'}
        />
         <DetailField
        label={'Site / Location'}
        />
         <DetailField
        label={'Contact Person'}
        />
         <DetailField
        label={'Contact No'}
        />
         <DetailField
        label={'Visit Purpose'}
        />

      </RoundedScrollContainer>
   </SafeAreaView>
  )
}

export default VisitDetails