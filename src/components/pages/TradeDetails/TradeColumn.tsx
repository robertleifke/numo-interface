import { useMemo } from "react";
import invariant from "tiny-invariant";
import tw, { css } from "twin.macro";

import {
  pickLongLendgines,
  pickShortLendgines,
} from "../../../utils/lendgines";
import { useTradeDetails } from ".";
import { Config } from "./Config";
import { Long } from "./Long";
import { ProvideLiquidity } from "./ProvideLiquidity";
import { Returns } from "./Returns";
import { Short } from "./Short";
import { TotalStats } from "./TotalStats";

export enum TradeType {
  Long = "Long",
  Short = "Short",
  // Swap = "Swap",
}

export const TradeColumn: React.FC = () => {
  const { trade, setTrade, lendgines, base, setSelectedLendgine } =
    useTradeDetails();

  const shortLendgine = useMemo(
    () => pickShortLendgines(lendgines, base)[0],
    [base, lendgines]
  );

  const longLendgine = useMemo(
    () => pickLongLendgines(lendgines, base)[0],
    [base, lendgines]
  );
  invariant(shortLendgine && longLendgine);

  const Tabs = (
    <div tw="flex gap-4 text-sm items-center w-full col-start-2 col-span-5">
      {[TradeType.Long, TradeType.Short].map((s) => {
        return (
          <div key={s}>
            <button
              css={css`
                ${tw`text-xl font-semibold text-secondary`}
                ${tw`hover:(text-default) transform duration-300 ease-in-out`}
                ${trade === s && tw`text-default`}
              `}
              onClick={() => {
                setTrade(s);
                s === TradeType.Long
                  ? setSelectedLendgine(longLendgine)
                  : setSelectedLendgine(shortLendgine);
              }}
            >
              <span>{s}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
  return (
    <div tw="pl-6 lg:pl-8 xl:pl-12 transform ease-in-out duration-300 py-2 flex flex-col gap-4 w-full">
      {Tabs}
      {trade === TradeType.Long && <Long />}
      {trade === TradeType.Short && <Short />}
      <ProvideLiquidity />
      <div tw="w-full border-b-2 border-gray-200" />
      <Returns />
      <div tw="w-full border-b-2 border-gray-200" />
      <TotalStats />
      <div tw="w-full border-b-2 border-gray-200" />
      <Config />
    </div>
  );
};
