import { getAddress } from "@ethersproject/address";

import { useMostLiquidMarket } from "../../../hooks/useExternalExchange";
import { AddressLink } from "../../../utils/beet";
import { LoadingSpinner } from "../../common/LoadingSpinner";
import { RowBetween } from "../../common/RowBetween";
import { useTradeDetails } from ".";

export const Config: React.FC = () => {
  const { base: denom, quote: other, lendgines } = useTradeDetails();
  const referenceMarketQuery = useMostLiquidMarket([denom, other]);

  return (
    <div tw="flex flex-col w-full">
      <RowBetween tw="items-center">
        <p tw="text-sm">Base token:</p>
        <AddressLink
          address={getAddress(denom.address)}
          tw="text-sm underline"
        />
      </RowBetween>
      <RowBetween tw="items-center">
        <p tw="text-sm">Speculative token:</p>
        <AddressLink
          address={getAddress(other.address)}
          tw="text-sm underline"
        />
      </RowBetween>
      <RowBetween tw="items-center">
        <p tw="text-sm">Reference market:</p>

        {referenceMarketQuery.data ? (
          <AddressLink
            address={referenceMarketQuery.data.address}
            tw="text-sm underline"
          />
        ) : (
          <LoadingSpinner />
        )}
      </RowBetween>
      <RowBetween tw="items-start">
        <p tw="text-sm">Lendgines:</p>

        <div tw="flex flex-col gap-4">
          {lendgines.map((l) => (
            <AddressLink
              key={l.address}
              address={l.address}
              tw="text-sm underline"
            />
          ))}
        </div>
      </RowBetween>
    </div>
  );
};
