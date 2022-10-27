import React from 'react';
import { chain, useAccount, useBalance } from 'wagmi';

import { ETH_ADDRESS } from '~/core/references';
import { useAssetPrices, useUserAssets } from '~/core/resources/assets';
import { useFirstTransactionTimestamp } from '~/core/resources/transactions';
import { useTransactions } from '~/core/resources/transactions/transactions';
import { useCurrentCurrencyStore } from '~/core/state/currentCurrency';
import { RainbowTransaction } from '~/core/types/transactions';
import { Box, Inset, Stack, Text } from '~/design-system';

import { ClearStorage } from '../../components/_dev/ClearStorage';
import { InjectToggle } from '../../components/_dev/InjectToggle';

export function Default() {
  const { address } = useAccount();
  const { currentCurrency, setCurrentCurrency } = useCurrentCurrencyStore();

  const { data: userAssets } = useUserAssets({
    address,
    currency: currentCurrency,
  });
  const { data: assetPrices } = useAssetPrices({
    assetAddresses: Object.keys(userAssets || {}).concat(ETH_ADDRESS),
    currency: currentCurrency,
  });
  const { data: transactions } = useTransactions({
    address,
    currency: currentCurrency,
  });
  const { data: mainnetBalance } = useBalance({
    addressOrName: address,
    chainId: chain.mainnet.id,
  });
  const { data: polygonBalance } = useBalance({
    addressOrName: address,
    chainId: chain.polygon.id,
  });
  const { data: firstTransactionTimestamp } = useFirstTransactionTimestamp({
    address,
  });

  return (
    <Inset space="20px">
      <Stack space="24px">
        <Text as="h1" size="20pt" weight="bold">
          Rainbow Rocks!!!
        </Text>
        <Stack space="16px">
          <Text size="14pt" weight="bold" color="labelSecondary">
            Mainnet Balance: {mainnetBalance?.formatted}
          </Text>
          <Text size="14pt" weight="bold" color="labelSecondary">
            Polygon Balance: {polygonBalance?.formatted}
          </Text>
          {firstTransactionTimestamp && (
            <Text size="14pt" weight="bold" color="labelTertiary">
              First transaction on:{' '}
              {new Date(firstTransactionTimestamp).toString()}
            </Text>
          )}
        </Stack>
        <InjectToggle />
        <ClearStorage />
        <Box
          as="button"
          background="surfaceSecondary"
          onClick={() => {
            const newCurrency = currentCurrency !== 'USD' ? 'USD' : 'GBP';
            setCurrentCurrency(newCurrency);
          }}
          padding="16px"
          style={{ borderRadius: 999 }}
        >
          <Text color="labelSecondary" size="16pt" weight="bold">
            {`CURRENT CURRENCY: ${currentCurrency?.toUpperCase()} | CHANGE`}
          </Text>
        </Box>
        <Text color="label" size="20pt" weight="bold">
          Assets:
        </Text>
        {Object.values(userAssets || {})
          .filter((asset) => asset?.price?.value)
          .map((asset, i) => (
            <Text
              color="labelSecondary"
              size="16pt"
              weight="medium"
              key={`${asset?.address}${i}`}
            >
              {`NAME: ${asset?.name} NATIVE PRICE: ${asset?.native?.price?.display} NATIVE BALANCE: ${asset?.native?.balance?.display} PRICE: ${asset?.price?.value} BALANCE: ${asset?.balance?.display}`}
            </Text>
          ))}
        <Text color="label" size="20pt" weight="bold">
          Transactions:
        </Text>
        {transactions?.map((tx: RainbowTransaction) => {
          return (
            <Text
              color="labelSecondary"
              size="16pt"
              weight="medium"
              key={tx?.hash}
            >
              {`${tx?.title} ${tx?.name}: ${tx.native?.display}`}
            </Text>
          );
        })}
        <Text color="label" size="20pt" weight="bold">
          Prices:
        </Text>
        {Object.values(assetPrices || {}).map((price, i) => {
          return (
            <Text
              color="labelSecondary"
              size="16pt"
              weight="medium"
              key={`prices-${i}`}
            >
              {`${price?.price?.display}: ${price?.change}`}
            </Text>
          );
        })}
      </Stack>
    </Inset>
  );
}
