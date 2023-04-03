import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { motion } from 'framer-motion';
import React, { useCallback, useMemo, useState } from 'react';
import { Address } from 'wagmi';

import SendSound from 'static/assets/audio/woosh.mp3';
import { i18n } from '~/core/languages';
import { QuoteTypeMap } from '~/core/raps/references';
import { useGasStore } from '~/core/state';
import { useConnectedToHardhatStore } from '~/core/state/currentSettings/connectedToHardhat';
import { ParsedSearchAsset } from '~/core/types/assets';
import { ChainId } from '~/core/types/chains';
import { truncateAddress } from '~/core/utils/address';
import { isLowerCaseMatch } from '~/core/utils/strings';
import {
  Bleed,
  Box,
  Button,
  ButtonSymbol,
  Inline,
  Row,
  Rows,
  Separator,
  Stack,
  Symbol,
  Text,
} from '~/design-system';
import { BottomSheet } from '~/design-system/components/BottomSheet/BottomSheet';
import { AccentColorProviderWrapper } from '~/design-system/components/Box/ColorContext';
import { ButtonOverflow } from '~/design-system/components/Button/ButtonOverflow';
import { SymbolProps } from '~/design-system/components/Symbol/Symbol';
import { ChevronDown } from '~/entries/popup/components/ChevronDown/ChevronDown';
import {
  ExplainerSheet,
  useExplainerSheetParams,
} from '~/entries/popup/components/ExplainerSheet/ExplainerSheet';
import { Navbar } from '~/entries/popup/components/Navbar/Navbar';
import { Spinner } from '~/entries/popup/components/Spinner/Spinner';
import { SwapFee } from '~/entries/popup/components/TransactionFee/TransactionFee';
import {
  useSwapReviewDetails,
  useSwapValidations,
} from '~/entries/popup/hooks/swap';
import { useRainbowNavigate } from '~/entries/popup/hooks/useRainbowNavigate';
import { ROUTES } from '~/entries/popup/urls';
import { zIndexes } from '~/entries/popup/utils/zIndexes';

import * as wallet from '../../../handlers/wallet';

import { SwapAssetCard } from './SwapAssetCard';
import { SwapRoutes } from './SwapRoutes';
import { SwapViewContractDropdown } from './SwapViewContractDropdown';

const DetailsRow = ({
  children,
  testId,
}: {
  children: React.ReactNode;
  testId: string;
}) => {
  return (
    <Box testId={`${testId}-details-row`} style={{ height: '32px' }}>
      <Inline height="full" alignVertical="center" alignHorizontal="justify">
        {children}
      </Inline>
    </Box>
  );
};

const CarrouselButton = ({
  textArray,
  symbol,
  testId,
}: {
  textArray: string[];
  symbol?: SymbolProps['symbol'];
  testId: string;
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const goToNextText = useCallback(() => {
    setCurrentTextIndex((currentTextIndex) =>
      currentTextIndex + 1 < textArray.length ? currentTextIndex + 1 : 0,
    );
  }, [textArray.length]);

  return (
    <ButtonOverflow>
      <Box testId={`${testId}-carrousel-button`} onClick={goToNextText}>
        <Inline space="4px" alignHorizontal="center" alignVertical="center">
          <Text size="14pt" weight="semibold" color="label">
            {textArray[currentTextIndex]}
          </Text>
          {symbol && (
            <Symbol
              symbol={symbol}
              weight="semibold"
              color="labelQuaternary"
              size={12}
            />
          )}
        </Inline>
      </Box>
    </ButtonOverflow>
  );
};

const Label = ({
  label,
  testId,
  infoButton = false,
  onClick = () => null,
}: {
  label: string;
  testId: string;
  infoButton?: boolean;
  onClick?: () => void;
}) => (
  <Box>
    <Stack space="8px">
      <Inline space="4px" alignVertical="center">
        <Box>
          <Text
            align="left"
            color="labelSecondary"
            size="14pt"
            weight="semibold"
          >
            {label}
          </Text>
        </Box>
        {infoButton && (
          <Box key="swap-settings-warning-icon">
            <Bleed vertical="6px" horizontal="6px">
              <ButtonSymbol
                symbol="info.circle.fill"
                color="labelQuaternary"
                height="28px"
                variant="tinted"
                onClick={onClick}
                testId={testId}
              />
            </Bleed>
          </Box>
        )}
      </Inline>
    </Stack>
  </Box>
);

export type SwapReviewSheetProps = {
  show: boolean;
  assetToSell?: ParsedSearchAsset | null;
  assetToSellValue?: string;
  assetToBuy?: ParsedSearchAsset | null;
  quote?: Quote | CrosschainQuote | QuoteError;
  flashbotsEnabled: boolean;
  hideSwapReview: () => void;
};

export const SwapReviewSheet = ({
  show,
  assetToSell,
  assetToSellValue,
  assetToBuy,
  quote,
  flashbotsEnabled,
  hideSwapReview,
}: SwapReviewSheetProps) => {
  if (!quote || !assetToBuy || !assetToSell || (quote as QuoteError)?.error)
    return null;
  return (
    <SwapReviewSheetWithQuote
      show={show}
      assetToSell={assetToSell}
      assetToSellValue={assetToSellValue}
      assetToBuy={assetToBuy}
      quote={quote as Quote | CrosschainQuote}
      flashbotsEnabled={flashbotsEnabled}
      hideSwapReview={hideSwapReview}
    />
  );
};

type SwapReviewSheetWithQuoteProps = {
  show: boolean;
  assetToSell: ParsedSearchAsset;
  assetToSellValue?: string;
  assetToBuy: ParsedSearchAsset;
  quote: Quote | CrosschainQuote;
  flashbotsEnabled: boolean;
  hideSwapReview: () => void;
};

const SwapReviewSheetWithQuote = ({
  show,
  assetToSell,
  assetToSellValue,
  assetToBuy,
  quote,
  flashbotsEnabled,
  hideSwapReview,
}: SwapReviewSheetWithQuoteProps) => {
  const navigate = useRainbowNavigate();
  const { connectedToHardhat } = useConnectedToHardhatStore();

  const [showMoreDetails, setShowDetails] = useState(false);
  const [sendingSwap, setSendingSwap] = useState(false);
  const { selectedGas } = useGasStore();

  const { buttonLabel: validationButtonLabel, enoughNativeAssetBalanceForGas } =
    useSwapValidations({
      assetToSell,
      assetToSellValue,
      selectedGas,
    });

  const { minimumReceived, swappingRoute, includedFee, exchangeRate } =
    useSwapReviewDetails({ quote, assetToBuy, assetToSell });

  const { explainerSheetParams, showExplainerSheet, hideExplainerSheet } =
    useExplainerSheetParams();

  const isBridge = useMemo(() => {
    const assetToSellAddressToCompare =
      assetToSell?.[
        assetToSell?.chainId === ChainId.mainnet ? 'address' : 'mainnetAddress'
      ];
    const assetToBuyAddressToCompare =
      assetToBuy?.[
        assetToBuy?.chainId === ChainId.mainnet ? 'address' : 'mainnetAddress'
      ];
    return isLowerCaseMatch(
      assetToSellAddressToCompare,
      assetToBuyAddressToCompare,
    );
  }, [assetToBuy, assetToSell]);

  const openMoreDetails = useCallback(() => setShowDetails(true), []);
  const closeMoreDetails = useCallback(() => setShowDetails(false), []);

  const executeSwap = useCallback(async () => {
    if (!assetToSell || !assetToBuy || !quote || sendingSwap) return;
    const type =
      assetToSell.chainId !== assetToBuy.chainId ? 'crosschainSwap' : 'swap';
    const q = quote as QuoteTypeMap[typeof type];
    setSendingSwap(true);
    const { nonce } = await wallet.executeRap<typeof type>({
      rapActionParameters: {
        sellAmount: q.sellAmount.toString(),
        buyAmount: q.buyAmount.toString(),
        chainId: connectedToHardhat ? ChainId.hardhat : assetToSell.chainId,
        assetToSell: assetToSell,
        assetToBuy: assetToBuy,
        quote: q,
      },
      type,
    });
    if (nonce) {
      navigate(ROUTES.HOME, { state: { activeTab: 'activity' } });
    } else {
      setSendingSwap(false);
    }
  }, [
    assetToBuy,
    assetToSell,
    connectedToHardhat,
    navigate,
    quote,
    sendingSwap,
  ]);

  const handleSwap = useCallback(() => {
    if (!enoughNativeAssetBalanceForGas) return;
    executeSwap();
    new Audio(SendSound).play();
  }, [enoughNativeAssetBalanceForGas, executeSwap]);

  const goBack = useCallback(() => {
    hideSwapReview();
    closeMoreDetails();
  }, [closeMoreDetails, hideSwapReview]);

  const openFlashbotsExplainer = useCallback(() => {
    showExplainerSheet({
      show: true,
      header: { emoji: '🤖' },
      title: i18n.t('explainers.swap.flashbots.title'),
      description: [i18n.t('explainers.swap.flashbots.description')],
      actionButton: {
        label: i18n.t('explainers.swap.flashbots.action_label'),
        variant: 'tinted',
        labelColor: 'blue',
        action: hideExplainerSheet,
      },
      testId: 'swap-review-flashbots',
    });
  }, [hideExplainerSheet, showExplainerSheet]);

  const openFeeExplainer = useCallback(() => {
    showExplainerSheet({
      show: true,
      header: { emoji: '🌈' },
      title: i18n.t('explainers.swap.fee.title'),
      description: [
        i18n.t('explainers.swap.fee.description', {
          feePercentage: includedFee[1],
        }),
      ],
      actionButton: {
        label: i18n.t('explainers.swap.fee.action_label'),
        variant: 'tinted',
        labelColor: 'blue',
        action: hideExplainerSheet,
      },
      testId: 'swap-review-fee',
    });
  }, [hideExplainerSheet, includedFee, showExplainerSheet]);

  const buttonLabel = useMemo(() => {
    if (!enoughNativeAssetBalanceForGas) {
      return validationButtonLabel;
    }
    return isBridge
      ? i18n.t('swap.review.bridge_confirmation', {
          sellSymbol: assetToSell.symbol,
        })
      : i18n.t('swap.review.swap_confirmation', {
          sellSymbol: assetToSell.symbol,
          buySymbol: assetToBuy.symbol,
        });
  }, [
    assetToBuy.symbol,
    assetToSell.symbol,
    enoughNativeAssetBalanceForGas,
    isBridge,
    validationButtonLabel,
  ]);

  const buttonColor = useMemo(
    () => (enoughNativeAssetBalanceForGas ? 'accent' : 'fillSecondary'),
    [enoughNativeAssetBalanceForGas],
  );

  return (
    <>
      <ExplainerSheet
        show={explainerSheetParams.show}
        header={explainerSheetParams.header}
        title={explainerSheetParams.title}
        description={explainerSheetParams.description}
        actionButton={explainerSheetParams.actionButton}
        linkButton={explainerSheetParams.linkButton}
        testId={explainerSheetParams.testId}
      />
      <BottomSheet show={show}>
        <Box
          background="surfacePrimaryElevatedSecondary"
          style={{
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
          }}
          paddingBottom="20px"
        >
          <Stack space="12px">
            <Box style={{ zIndex: 10 }}>
              <Navbar
                title={i18n.t(
                  `swap.review.${isBridge ? 'title_bridge' : 'title_swap'}`,
                )}
                titleTestId="swap-review-title-text"
                leftComponent={
                  <Navbar.CloseButton testId="swap-review" onClick={goBack} />
                }
              />
            </Box>

            <Box>
              <Inline
                space="10px"
                alignVertical="center"
                alignHorizontal="center"
              >
                <SwapAssetCard
                  testId={`${assetToSell.symbol}-asset-to-sell`}
                  asset={assetToSell}
                  assetAmount={quote.sellAmount.toString()}
                />
                <Box
                  boxShadow="12px surfaceSecondaryElevated"
                  background="surfaceSecondaryElevated"
                  borderRadius="32px"
                  borderWidth={'1px'}
                  borderColor="buttonStroke"
                  style={{
                    width: 32,
                    height: 32,
                    zIndex: zIndexes.CUSTOM_GAS_SHEET - 1,
                    position: 'absolute',
                    left: '0 auto',
                  }}
                >
                  <Inline
                    height="full"
                    alignHorizontal="center"
                    alignVertical="center"
                  >
                    <Inline alignHorizontal="center">
                      <Box style={{ rotate: '-90deg' }} marginRight="-6px">
                        <ChevronDown color="labelTertiary" />
                      </Box>
                      <Box style={{ rotate: '-90deg' }} marginLeft="-6px">
                        <ChevronDown color="labelQuaternary" />
                      </Box>
                    </Inline>
                  </Inline>
                </Box>

                <SwapAssetCard
                  testId={`${assetToBuy.symbol}-asset-to-buy`}
                  asset={assetToBuy}
                  assetAmount={quote.buyAmount.toString()}
                />
              </Inline>
            </Box>
            <Box paddingHorizontal="20px">
              <Stack space="4px">
                <DetailsRow testId="minimum-received">
                  <Label
                    label={i18n.t('swap.review.minimum_received')}
                    testId="swap-review-swapping-route"
                  />
                  <Text size="14pt" weight="semibold" color="label">
                    {minimumReceived}
                  </Text>
                </DetailsRow>
                <DetailsRow testId="swapping-via">
                  <Label
                    label={i18n.t('swap.review.swapping_via')}
                    testId="swap-review-swapping-route"
                  />
                  {!!swappingRoute && (
                    <SwapRoutes
                      testId="swapping-via"
                      protocols={swappingRoute}
                    />
                  )}
                </DetailsRow>
                <DetailsRow testId="included-fee">
                  <Label
                    label={i18n.t('swap.review.included_fee')}
                    testId="swap-review-rnbw-fee-info-button"
                    infoButton
                    onClick={openFeeExplainer}
                  />
                  <CarrouselButton
                    testId="included-fee"
                    textArray={includedFee}
                  />
                </DetailsRow>

                {flashbotsEnabled && (
                  <DetailsRow testId="flashbots-enabled">
                    <Label
                      label={i18n.t('swap.review.use_flashbots')}
                      testId="swap-review-flashbots-info-button"
                      infoButton
                      onClick={openFlashbotsExplainer}
                    />
                    <Inline
                      space="4px"
                      alignHorizontal="center"
                      alignVertical="center"
                    >
                      <Text size="14pt" weight="semibold" color="label">
                        {i18n.t('swap.review.flashbots_on')}
                      </Text>
                      <Symbol
                        symbol="checkmark.shield.fill"
                        weight="semibold"
                        color="green"
                        size={12}
                      />
                    </Inline>
                  </DetailsRow>
                )}
                <Box as={motion.div} key="more-details" layout>
                  {showMoreDetails && (
                    <Box
                      as={motion.div}
                      key="more-details-shown"
                      testId="more-details-section"
                      layout
                    >
                      <DetailsRow testId="exchange-rate">
                        <Label
                          label={i18n.t('swap.review.exchange_rate')}
                          testId="swap-review-exchange-rate"
                        />
                        <CarrouselButton
                          testId="exchange-rate"
                          symbol="arrow.2.squarepath"
                          textArray={exchangeRate}
                        />
                      </DetailsRow>
                      {!assetToSell.isNativeAsset && (
                        <DetailsRow testId="asset-to-sell-contract">
                          <Label
                            label={i18n.t('swap.review.asset_contract', {
                              symbol: assetToSell.symbol,
                            })}
                            testId="swap-review-asset-to-sell-contract"
                          />

                          <SwapViewContractDropdown
                            testId="asset-to-sell"
                            address={assetToSell.address as Address}
                            chainId={assetToSell.chainId}
                          >
                            <Text size="14pt" weight="semibold" color="label">
                              {truncateAddress(assetToSell.address)}
                            </Text>
                          </SwapViewContractDropdown>
                        </DetailsRow>
                      )}
                      {!assetToBuy.isNativeAsset && (
                        <DetailsRow testId="asset-to-buy-contract">
                          <Label
                            label={i18n.t('swap.review.asset_contract', {
                              symbol: assetToBuy.symbol,
                            })}
                            testId="swap-review-asset-to-buy-contract"
                          />
                          <SwapViewContractDropdown
                            testId="asset-to-buy"
                            address={assetToBuy.address as Address}
                            chainId={assetToBuy.chainId}
                          >
                            <Text size="14pt" weight="semibold" color="label">
                              {truncateAddress(assetToBuy.address)}
                            </Text>
                          </SwapViewContractDropdown>
                        </DetailsRow>
                      )}
                    </Box>
                  )}
                  {!showMoreDetails && (
                    <Box as={motion.div} key="more-details-hidden" layout>
                      <DetailsRow testId="more-details-hidden">
                        <Label
                          label={i18n.t('swap.review.more_details')}
                          testId="swap-review-details"
                        />
                        <ButtonSymbol
                          symbol="chevron.down.circle"
                          symbolSize={12}
                          color="labelQuaternary"
                          height="24px"
                          variant="tinted"
                          onClick={openMoreDetails}
                          testId="swap-review-more-details-button"
                        />
                      </DetailsRow>
                    </Box>
                  )}
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Box>
        <Separator strokeWeight="1px" color="separatorSecondary" />
        <Box padding="20px">
          <AccentColorProviderWrapper
            color={assetToBuy.colors.primary || assetToBuy.colors.fallback}
          >
            <Box>
              <Rows space="20px">
                <Row>
                  <SwapFee
                    chainId={assetToSell?.chainId || ChainId.mainnet}
                    quote={quote}
                    accentColor={
                      assetToBuy?.colors?.primary ||
                      assetToBuy?.colors?.fallback
                    }
                    assetToSell={assetToSell}
                    assetToBuy={assetToBuy}
                    enabled={show}
                    defaultSpeed={selectedGas.option}
                  />
                </Row>
                <Row>
                  <Button
                    onClick={handleSwap}
                    height="44px"
                    variant="flat"
                    color={buttonColor}
                    width="full"
                    testId="swap-review-execute"
                  >
                    {sendingSwap ? (
                      <Box
                        width="fit"
                        alignItems="center"
                        justifyContent="center"
                        style={{ margin: 'auto' }}
                      >
                        <Spinner size={16} color="label" />
                      </Box>
                    ) : (
                      <Text
                        testId="swap-review-confirmation-text"
                        color="label"
                        size="16pt"
                        weight="bold"
                      >
                        {buttonLabel}
                      </Text>
                    )}
                  </Button>
                </Row>
              </Rows>
            </Box>
          </AccentColorProviderWrapper>
        </Box>
      </BottomSheet>
    </>
  );
};
