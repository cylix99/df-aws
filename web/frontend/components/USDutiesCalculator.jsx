import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Banner,
  Spinner,
  Stack,
  TextContainer,
  Button,
  InlineStack,
  Box
} from '@shopify/polaris';
import { useAuthenticatedFetch } from '../hooks';

/**
 * Component to calculate and display US customs duties for orders
 */
export function USDutiesCalculator({ 
  orderItems, 
  orderTotal, 
  orderCurrency, 
  shippingAddress, 
  onDutiesCalculated 
}) {
  const [dutiesData, setDutiesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetch = useAuthenticatedFetch();

  // Check if shipping to US
  const isUSShipment = shippingAddress && 
    ['US', 'USA', 'UNITED STATES'].includes(
      (shippingAddress.country_code || shippingAddress.country || '').toUpperCase()
    );

  useEffect(() => {
    if (isUSShipment && orderItems && orderItems.length > 0 && orderTotal > 0) {
      calculateDuties();
    } else {
      setDutiesData(null);
      if (onDutiesCalculated) {
        onDutiesCalculated(null);
      }
    }
  }, [orderItems, orderTotal, orderCurrency, isUSShipment]);

  const calculateDuties = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/calculate-duties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: orderItems,
          totalValue: orderTotal,
          currency: orderCurrency || 'GBP',
          shippingAddress
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setDutiesData(data);
      
      if (onDutiesCalculated) {
        onDutiesCalculated(data);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error calculating duties:', err);
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if not shipping to US
  if (!isUSShipment) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <Box padding="4">
          <InlineStack gap="2" align="center">
            <Spinner size="small" />
            <Text variant="bodyMd">Calculating US customs duties...</Text>
          </InlineStack>
        </Box>
      </Card>
    );
  }

  if (error) {
    return (
      <Banner tone="critical" title="Error calculating duties">
        <Text as="p">{error}</Text>
        <Box paddingBlockStart="2">
          <Button onClick={calculateDuties} size="slim">
            Try again
          </Button>
        </Box>
      </Banner>
    );
  }

  if (!dutiesData || !dutiesData.dutyRequired) {
    return null;
  }

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <Card>
      <Box padding="4">
        <Stack>
          <Banner tone="info" title="US Customs Duties Required">
            <TextContainer>
              <Text as="p">
                Due to new US import regulations, all shipments from the UK to the US are subject to customs duties.
              </Text>
            </TextContainer>
          </Banner>

          <Stack>
            <Text variant="headingMd" as="h3">
              Duties Breakdown
            </Text>
            
            <Stack gap="2">
              <InlineStack align="space-between">
                <Text>Customs Duty (10%)</Text>
                <Text variant="bodyMd" fontWeight="semibold">
                  {formatCurrency(dutiesData.totalDuties, dutiesData.currency)}
                </Text>
              </InlineStack>
              
              <InlineStack align="space-between">
                <Text>Processing Fee</Text>
                <Text variant="bodyMd" fontWeight="semibold">
                  {formatCurrency(dutiesData.adminFee, dutiesData.currency)}
                </Text>
              </InlineStack>
              
              <Box borderBlockStart="divider" paddingBlockStart="2">
                <InlineStack align="space-between">
                  <Text variant="bodyMd" fontWeight="semibold">
                    Total Additional Charges
                  </Text>
                  <Text variant="bodyLg" fontWeight="bold">
                    {formatCurrency(dutiesData.totalCharges, dutiesData.currency)}
                  </Text>
                </InlineStack>
              </Box>
            </Stack>
          </Stack>

          {dutiesData.breakdown && dutiesData.breakdown.length > 0 && (
            <Stack>
              <Text variant="headingMd" as="h3">
                Item Details
              </Text>
              <Stack gap="1">
                {dutiesData.breakdown.map((item, index) => (
                  <InlineStack key={index} align="space-between">
                    <Text variant="bodyMd">
                      {item.productTitle} (x{item.quantity})
                    </Text>
                    <Text variant="bodyMd">
                      {formatCurrency(item.duty, item.currency)}
                    </Text>
                  </InlineStack>
                ))}
              </Stack>
            </Stack>
          )}

          <Banner tone="success" title="No Surprises at Delivery">
            <TextContainer>
              <Text as="p">
                <strong>We're switching to Royal Mail PDDP (Postage Duties Delivery Paid)</strong> - 
                this means we'll handle all duties upfront so there are no additional charges or delays when your order arrives!
              </Text>
            </TextContainer>
          </Banner>

          <Stack gap="1">
            <Text variant="bodyMd" fontWeight="semibold">
              HTS Code: {dutiesData.htsCode}
            </Text>
            <Text variant="bodySm" color="subdued">
              Jigsaw puzzles are classified as toys under US customs regulations
            </Text>
          </Stack>
        </Stack>
      </Box>
    </Card>
  );
}

export default USDutiesCalculator;