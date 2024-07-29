import React, { useState, useCallback } from 'react';
import { RoundedScrollContainer, SafeAreaView } from '@components/containers';
import { useFocusEffect } from '@react-navigation/native';
import { DetailField } from '@components/common/Detail';
import { formatDateTime } from '@utils/common/date';
import { showToastMessage } from '@components/Toast';
import { fetchPipelineDetails } from '@api/details/detailApi';
import { OverlayLoader } from '@components/Loader';

const Details = ({ pipelineId }) => {
  const [details, setDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false)

  const fetchDetails = async (pipelineId) => {
    setIsLoading(true);
    try {
      const updatedDetails = await fetchPipelineDetails(pipelineId);
      setDetails(updatedDetails[0]);
    } catch (error) {
      console.error('Error fetching pipeline details:', error);
      showToastMessage('Failed to fetch pipeline details. Please try again.');
    } finally {
      setIsLoading(false)
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (pipelineId) {
        fetchDetails(pipelineId);
      }
    }, [pipelineId])
  );

  return (
    <RoundedScrollContainer>
      <DetailField label="Date & Time" value={formatDateTime(details.date)} />
      <DetailField label="Source" value={details?.source?.source_name || '-'} />
      <DetailField label="Enquiry Type" value={details?.enquiry_type || '-'} />
      <DetailField label="Sales Person" value={details?.sales_person || '-'} />
      <DetailField label="Opportunity" value={details?.opportunity || '-'} />
      <DetailField label="Customer" value={details?.customer || '-'} />
      <DetailField
        label="Remarks"
        value={details?.remarks || '-'}
        multiline
        numberOfLines={5}
      />
      <OverlayLoader visible={isLoading} />
    </RoundedScrollContainer>
  );
};

export default Details;
