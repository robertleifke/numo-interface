import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CurrencyAmount, Token } from "@uniswap/sdk-core";
import React, { useState } from "react";
import tw, { css, styled } from "twin.macro";

import { useAddressToMarket } from "../../contexts/environment";
import useWindowDimensions from "../../utils/useWindowDimensions";
import { BigNumericInput } from "./inputs/BigNumericInput";
import SelectTokenDialog from "./SelectTokenDialog";
import { TokenAmountDisplay } from "./TokenAmountDisplay";
import { TokenIcon } from "./TokenIcon";

export const AssetSelectButton = styled.button(
  ({ noAsset }: { noAsset?: boolean }) => [
    tw`relative flex items-center justify-between flex-none text-left text-black `,
    tw`text-base appearance-none cursor-pointer`,
    tw`whitespace-nowrap`,
    tw`shadow-none`,
    noAsset && tw`text-black bg-brand `,
  ]
);

const Accent = styled.span<{ onClick?: () => void }>`
  margin-left: 0.5em;

  ${({ onClick }) =>
    onClick !== undefined &&
    css`
      cursor: pointer;
      &:hover {
        text-decoration: underline;
      }
    `}
`;

const Balance = styled.div(tw`flex items-center`);

const Section = styled.div(tw`flex items-center justify-between`);

const DEFAULT_TOKEN_DECIMALS = 3;

type Props<T extends Token> = {
  tokens?: readonly T[];
  onSelect?: (token: T) => void;
  selectedValue: T | null;
  inputOnChange?: (val: string) => void;
  inputValue?: string;
  hideInput?: boolean;
  inputDisabled?: boolean;
  className?: string;
  label?: string | React.ReactNode;
  currentAmount?: {
    amount?: CurrencyAmount<T>;
    allowSelect?: boolean;
    label?: string;
  };
};

export const AssetSelection = <T extends Token>({
  onSelect,
  selectedValue,
  inputValue,
  className,
  inputDisabled = false,
  hideInput = false,
  inputOnChange,
  label,
  currentAmount,
  tokens,
}: Props<T>) => {
  const { width } = useWindowDimensions();

  const uiDecimals =
    width < 600 ? 4 : selectedValue?.decimals ?? DEFAULT_TOKEN_DECIMALS;

  const token = selectedValue;

  const market = useAddressToMarket(token?.address ?? null);

  const [show, setShow] = useState(false);

  return (
    <div tw="flex w-full flex-col pt-2 px-2" className={className}>
      <>
        <Section>
          <div tw=" text-secondary text-xs">{label}</div>
          <div tw=" text-secondary text-xs flex">
            {selectedValue &&
              (currentAmount && !hideInput ? (
                <Balance>
                  <span>{currentAmount.label ?? "Balance"}:</span>
                  <Accent
                    onClick={
                      currentAmount.allowSelect && inputOnChange
                        ? () => {
                            if (
                              !currentAmount.amount ||
                              currentAmount.amount.equalTo("0")
                            ) {
                              inputOnChange("0");
                              return;
                            }
                            inputOnChange(currentAmount.amount.toExact());
                          }
                        : undefined
                    }
                  >
                    <TokenAmountDisplay
                      tw="text-default "
                      amount={
                        currentAmount.amount ??
                        new TokenAmount(selectedValue, 0)
                      }
                      locale="en-US"
                      numberFormatOptions={{
                        minimumFractionDigits: uiDecimals,
                        maximumFractionDigits: uiDecimals,
                      }}
                    />
                  </Accent>
                </Balance>
              ) : (
                <div />
              ))}
          </div>
        </Section>
      </>
      <div tw="flex gap-3 w-full items-center">
        <div>
          <SelectTokenDialog
            tw="rounded-xl w-full"
            isOpen={show}
            onDismiss={() => setShow(false)}
            selectedToken={selectedValue ?? undefined}
            onSelect={(token) => {
              onSelect?.(token);
              setShow?.(false);
            }}
            tokens={tokens}
          />
          <div tw={"flex relative py-0 rounded-xl"}>
            <div>
              <AssetSelectButton
                onClick={() => {
                  if (onSelect) {
                    setShow(true);
                  }
                }}
                noAsset={!token}
              >
                {!token ? (
                  <div tw={"flex p-1.5 space-x-2 items-center"}>
                    <div tw="text-lg font-semibold leading-none text-white">
                      Select a token
                    </div>
                  </div>
                ) : market ? (
                  <PowerIcon market={market} />
                ) : (
                  <div tw="flex items-center space-x-2">
                    <TokenIcon size={24} token={token} />
                    <div tw="mr-1 space-y-1">
                      <div tw="text-xl font-semibold leading-none">
                        {token.symbol}
                      </div>
                    </div>
                  </div>
                )}

                {onSelect &&
                  (!token ? (
                    <div tw="text-sm flex items-center ml-2 text-white">
                      <FontAwesomeIcon fixedWidth icon={faChevronDown} />
                    </div>
                  ) : !market ? (
                    <div tw="text-sm flex items-center ml-2">
                      <FontAwesomeIcon fixedWidth icon={faChevronDown} />
                    </div>
                  ) : null)}
              </AssetSelectButton>
            </div>
          </div>
        </div>
        {!hideInput && (
          <div tw="flex grow flex-1">
            <BigNumericInput
              tw="text-right text-default w-full py-1"
              disabled={inputDisabled}
              value={inputValue}
              onChange={inputOnChange}
              placeholder="0.0"
            />
          </div>
        )}
      </div>
    </div>
  );
};
