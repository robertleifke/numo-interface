import { Percent, TokenAmount } from "@dahlia-labs/token-utils";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import invariant from "tiny-invariant";
import { useAccount } from "wagmi";

import type { IMarket } from "../../../../../contexts/environment";
import { LIQUIDITYMANAGER } from "../../../../../contexts/environment";
import type { ISettings } from "../../../../../contexts/settings";
import { useApproval, useApprove } from "../../../../../hooks/useApproval";
import { useLiquidityManager } from "../../../../../hooks/useContract";
import { useNextTokenID, usePrice } from "../../../../../hooks/useLendgine";
import { usePair } from "../../../../../hooks/usePair";
import { useTokenBalances } from "../../../../../hooks/useTokenBalance";
import type { BeetStage, BeetTx } from "../../../../../utils/beet";
import { useBeet } from "../../../../../utils/beet";
import { scale } from "../../../Trade/useTrade";

export const useDeposit = (
  market: IMarket,
  tokenID: number | null,
  baseTokenAmount: TokenAmount | null,
  speculativeTokenAmount: TokenAmount | null,
  settings: ISettings
): { onSend: () => Promise<void>; disableReason: string | null } => {
  const liquidityManagerContract = useLiquidityManager(true);
  const Beet = useBeet();
  const { address } = useAccount();
  const pairInfo = usePair(market.pair);
  const price = usePrice(market);
  const nextID = useNextTokenID();
  const navigate = useNavigate();

  const liquidity = useMemo(() => {
    if (!pairInfo || !price || !baseTokenAmount || !speculativeTokenAmount)
      return null;

    if (pairInfo.totalLPSupply.equalTo(0)) {
      return new TokenAmount(
        market.pair.lp,
        baseTokenAmount.scale(price.asFraction.multiply(price).invert()).raw
      );
    }

    return new TokenAmount(
      market.pair.lp,
      pairInfo.totalLPSupply.scale(
        baseTokenAmount.divide(pairInfo.baseAmount)
      ).raw
    );
  }, [
    baseTokenAmount,
    market.pair.lp,
    pairInfo,
    price,
    speculativeTokenAmount,
  ]);

  const balances = useTokenBalances(
    [market?.pair.baseToken ?? null, market?.pair.speculativeToken ?? null],
    address
  );

  const approvalS = useApproval(
    speculativeTokenAmount,
    address,
    LIQUIDITYMANAGER
  );
  const approvalB = useApproval(baseTokenAmount, address, LIQUIDITYMANAGER);
  const approveS = useApprove(speculativeTokenAmount, LIQUIDITYMANAGER);

  const approveB = useApprove(baseTokenAmount, LIQUIDITYMANAGER);

  const disableReason = useMemo(
    () =>
      !baseTokenAmount || !speculativeTokenAmount
        ? "Enter an amount"
        : baseTokenAmount.equalTo(0) && speculativeTokenAmount.equalTo(0)
        ? "Enter an amount"
        : !balances ||
          approvalS === null ||
          approvalB === null ||
          !price ||
          !liquidity ||
          nextID === null
        ? "Loading..."
        : (balances[1] && speculativeTokenAmount.greaterThan(balances[1])) ||
          (balances[0] && baseTokenAmount.greaterThan(balances[0]))
        ? "Insufficient funds"
        : null,
    [
      baseTokenAmount,
      speculativeTokenAmount,
      balances,
      approvalS,
      approvalB,
      price,
      liquidity,
      nextID,
    ]
  );

  const onSend = async () => {
    invariant(
      liquidityManagerContract &&
        speculativeTokenAmount &&
        baseTokenAmount &&
        liquidity
    );
    const approveStage: BeetStage[] =
      approvalS || approvalB
        ? [
            {
              stageTitle: "Approve tokens",
              parallelTransactions: [
                approvalS
                  ? {
                      title: `Approve ${speculativeTokenAmount.token.symbol}`,
                      description: `Approve ${speculativeTokenAmount.toFixed(
                        2,
                        {
                          groupSeparator: ",",
                        }
                      )} ${speculativeTokenAmount.token.symbol}`,
                      txEnvelope: approveS,
                    }
                  : null,
                approvalB
                  ? {
                      title: `Approve ${baseTokenAmount.token.symbol}`,
                      description: `Approve ${baseTokenAmount.toFixed(2, {
                        groupSeparator: ",",
                      })} ${baseTokenAmount.token.symbol}`,
                      txEnvelope: approveB,
                    }
                  : null,
              ].filter((t) => t !== null) as BeetTx[],
            },
          ]
        : [];

    invariant(address && pairInfo && nextID !== null);

    !tokenID
      ? await Beet(
          "Add liquidity to pool",
          approveStage.concat({
            stageTitle: "Add liquidity to pool",
            parallelTransactions: [
              {
                title: "Add liquidity to pool",
                description: "Add liquidity to pool",
                txEnvelope: () =>
                  liquidityManagerContract.mint({
                    base: market.pair.baseToken.address,
                    speculative: market.pair.speculativeToken.address,
                    baseScaleFactor: market.pair.baseScaleFactor,
                    speculativeScaleFactor: market.pair.speculativeScaleFactor,
                    upperBound: market.pair.bound.asFraction
                      .multiply(scale)
                      .quotient.toString(),
                    amount0Min: baseTokenAmount
                      .reduceBy(
                        pairInfo.totalLPSupply.equalTo(0)
                          ? new Percent(0)
                          : settings.maxSlippagePercent
                      )
                      .raw.toString(),
                    amount1Min: speculativeTokenAmount
                      .reduceBy(
                        pairInfo.totalLPSupply.equalTo(0)
                          ? new Percent(0)
                          : settings.maxSlippagePercent
                      )
                      .raw.toString(),
                    liquidity: liquidity.raw.toString(),
                    recipient: address,
                    deadline:
                      Math.round(Date.now() / 1000) + settings.timeout * 60,
                  }),
              },
            ],
          })
        )
      : await Beet(
          "Add liquidity to pool",
          approveStage.concat({
            stageTitle: "Add liquidity to pool",
            parallelTransactions: [
              {
                title: "Add liquidity to pool",
                description: "Add liquidity to pool",
                txEnvelope: () =>
                  liquidityManagerContract.increaseLiquidity({
                    tokenID,
                    amount0Min: baseTokenAmount
                      .reduceBy(settings.maxSlippagePercent)
                      .raw.toString(),
                    amount1Min: speculativeTokenAmount
                      .reduceBy(settings.maxSlippagePercent)
                      .raw.toString(),
                    liquidity: liquidity.raw.toString(),
                    deadline:
                      Math.round(Date.now() / 1000) + settings.timeout * 60,
                  }),
              },
            ],
          })
        );

    if (!tokenID) {
      navigate(`/earn/${market.address}/${nextID + 1}/`);
    }

    // TODO: only navigate if no error
    // TODO: clear out the forms
  };

  return {
    disableReason,
    onSend,
  };
};
