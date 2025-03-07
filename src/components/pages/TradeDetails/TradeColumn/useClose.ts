import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CurrencyAmount } from "@uniswap/sdk-core";
import { BigNumber, constants, utils } from "ethers";
import { useMemo } from "react";
import type { Address } from "wagmi";
import { useAccount } from "wagmi";
import type { SendTransactionResult } from "wagmi/actions";
import {
  getContract,
  prepareWriteContract,
  writeContract,
} from "wagmi/actions";

import { toaster } from "../../../../AppWithProviders";
import { lendgineRouterABI } from "../../../../abis/lendgineRouter";
import { useSettings } from "../../../../contexts/settings";
import { useEnvironment } from "../../../../contexts/useEnvironment";
import type { HookArg } from "../../../../hooks/internal/types";
import { useInvalidateCall } from "../../../../hooks/internal/useInvalidateCall";
import { getAllowanceRead } from "../../../../hooks/useAllowance";
import { useApprove } from "../../../../hooks/useApprove";
import { useAwaitTX } from "../../../../hooks/useAwaitTX";
import { getBalanceRead, useBalance } from "../../../../hooks/useBalance";
import {
  isV3,
  useMostLiquidMarket,
} from "../../../../hooks/useExternalExchange";
import { useLendgine } from "../../../../hooks/useLendgine";
import { useIsWrappedNative } from "../../../../hooks/useTokens";
import { ONE_HUNDRED_PERCENT, scale } from "../../../../lib/constants";
import {
  accruedLendgineInfo,
  getT,
  liquidityPerShare,
} from "../../../../lib/lendgineMath";
import { priceToFraction } from "../../../../lib/price";
import type { Lendgine } from "../../../../lib/types/lendgine";
import type { WrappedTokenInfo } from "../../../../lib/types/wrappedTokenInfo";
import type { UniswapV2Pool } from "../../../../services/graphql/uniswapV2";
import type { UniswapV3Pool } from "../../../../services/graphql/uniswapV3";
import type { BeetStage, TxToast } from "../../../../utils/beet";
import { useTradeDetails } from "../TradeDetailsInner";
import { usePositionValue } from "../usePositionValue";

export const useClose = ({
  amountOut,
}: {
  amountOut: HookArg<CurrencyAmount<WrappedTokenInfo>>;
}) => {
  const { address } = useAccount();
  const environment = useEnvironment();
  const settings = useSettings();

  const awaitTX = useAwaitTX();
  const invalidate = useInvalidateCall();
  const queryClient = useQueryClient();

  const { selectedLendgine, base, quote } = useTradeDetails();
  const mostLiquid = useMostLiquidMarket({ base, quote });
  const { shares, amount0, amount1 } = useCloseAmounts({ amountOut });

  const native = useIsWrappedNative(selectedLendgine.token1);

  const approve = useApprove(shares, environment.base.lendgineRouter);

  const approveMutation = useMutation({
    mutationFn: async ({
      approveTx,
      toast,
    }: { approveTx: () => Promise<SendTransactionResult> } & {
      toast: TxToast;
    }) => {
      const transaction = await approveTx();

      toaster.txPending({ ...toast, hash: transaction.hash });

      return await awaitTX(transaction);
    },
    onMutate: ({ toast }) => toaster.txSending(toast),
    onError: (_, { toast }) => toaster.txError(toast),
    onSuccess: async (data, input) => {
      toaster.txSuccess({ ...input.toast, receipt: data });
      await invalidate(
        getAllowanceRead(
          selectedLendgine.lendgine,
          address ?? constants.AddressZero,
          environment.base.lendgineRouter
        )
      );
    },
  });

  const lendgineRouterContract = getContract({
    abi: lendgineRouterABI,
    address: environment.base.lendgineRouter,
  });

  const title = `Sell ${selectedLendgine.token1.symbol}+`;

  const burnMutation = useMutation({
    mutationFn: async ({
      shares,
      amount0,
      amount1,
      amountOut,
      mostLiquidPool,
      address,
      toast,
    }: {
      shares: CurrencyAmount<Lendgine["lendgine"]>;
      amount0: CurrencyAmount<WrappedTokenInfo>;
      amount1: CurrencyAmount<WrappedTokenInfo>;
      amountOut: CurrencyAmount<WrappedTokenInfo>;
      mostLiquidPool: UniswapV2Pool | UniswapV3Pool;
      address: Address;
    } & { toast: TxToast }) => {
      const args = [
        {
          token0: utils.getAddress(selectedLendgine.token0.address),
          token1: utils.getAddress(selectedLendgine.token1.address),
          token0Exp: BigNumber.from(selectedLendgine.token0.decimals),
          token1Exp: BigNumber.from(selectedLendgine.token1.decimals),
          upperBound: BigNumber.from(
            priceToFraction(selectedLendgine.bound)
              .multiply(scale)
              .quotient.toString()
          ),
          shares: BigNumber.from(shares.quotient.toString()),
          collateralMin: BigNumber.from(
            amountOut
              .multiply(
                ONE_HUNDRED_PERCENT.subtract(settings.maxSlippagePercent)
              )
              .quotient.toString()
          ),
          amount0Min: BigNumber.from(
            amount0
              .multiply(
                ONE_HUNDRED_PERCENT.subtract(settings.maxSlippagePercent)
              )
              .quotient.toString()
          ),
          amount1Min: BigNumber.from(
            amount1
              .multiply(
                ONE_HUNDRED_PERCENT.subtract(settings.maxSlippagePercent)
              )
              .quotient.toString()
          ),
          swapType: isV3(mostLiquidPool) ? 1 : 0,
          swapExtraData: isV3(mostLiquidPool)
            ? (utils.defaultAbiCoder.encode(
                ["tuple(uint24 fee)"],
                [
                  {
                    fee: mostLiquidPool.feeTier,
                  },
                ]
              ) as Address)
            : constants.AddressZero,
          recipient: native ? constants.AddressZero : address,
          deadline: BigNumber.from(
            Math.round(Date.now() / 1000) + settings.timeout * 60
          ),
        },
      ] as const;

      const unwrapArgs = [
        BigNumber.from(
          amountOut
            .multiply(ONE_HUNDRED_PERCENT.subtract(settings.maxSlippagePercent))
            .quotient.toString()
        ),
        address,
      ] as const;

      const tx = native
        ? async () => {
            const config = await prepareWriteContract({
              abi: lendgineRouterABI,
              functionName: "multicall",
              address: environment.base.lendgineRouter,
              args: [
                [
                  lendgineRouterContract.interface.encodeFunctionData(
                    "burn",
                    args
                  ),
                  lendgineRouterContract.interface.encodeFunctionData(
                    "unwrapWETH",
                    unwrapArgs
                  ),
                ] as `0x${string}`[],
              ],
            });

            const data = await writeContract(config);
            return data;
          }
        : async () => {
            const config = await prepareWriteContract({
              abi: lendgineRouterABI,
              functionName: "burn",
              address: environment.base.lendgineRouter,
              args,
            });

            const data = await writeContract(config);
            return data;
          };

      const transaction = await tx();

      toaster.txPending({ ...toast, hash: transaction.hash });

      return awaitTX(transaction);
    },
    onMutate: ({ toast }) => toaster.txSending(toast),
    onError: (_, { toast }) => toaster.txError(toast),
    onSuccess: async (data, input) => {
      toaster.txSuccess({ ...input.toast, receipt: data });
      await Promise.all([
        invalidate(
          getAllowanceRead(
            input.shares.currency,
            input.address,
            environment.base.lendgineRouter
          )
        ),
        invalidate(getBalanceRead(input.amountOut.currency, input.address)),
        invalidate(getBalanceRead(input.shares.currency, input.address)),
        queryClient.invalidateQueries({
          queryKey: ["user trades", input.address],
        }),
      ]);
    },
  });

  return useMemo(() => {
    if (approve.status === "loading") return { status: "loading" } as const;

    if (
      !shares ||
      !amount0 ||
      !amount1 ||
      !amountOut ||
      !mostLiquid.data ||
      !address
    )
      return { status: "error" } as const;

    return {
      status: "success",
      data: (
        [
          approve.tx
            ? {
                title: approve.title,
                parallelTxs: [
                  {
                    title: approve.title,
                    description: approve.title,
                    callback: (toast: TxToast) =>
                      approveMutation.mutateAsync({
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        approveTx: approve.tx!,
                        toast,
                      }),
                  },
                ],
              }
            : undefined,
          {
            title,
            parallelTxs: [
              {
                title,
                description: title,
                callback: (toast: TxToast) =>
                  burnMutation.mutateAsync({
                    shares,
                    amount0,
                    amount1,
                    amountOut,
                    address,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    mostLiquidPool: mostLiquid.data.pool,
                    toast,
                  }),
              },
            ],
          },
        ] as readonly (BeetStage | undefined)[]
      ).filter((s): s is BeetStage => !!s),
    } as const satisfies { data: readonly BeetStage[]; status: "success" };
  }, [
    address,
    amount0,
    amount1,
    amountOut,
    approve.status,
    approve.title,
    approve.tx,
    approveMutation,
    burnMutation,
    mostLiquid.data,
    shares,
    title,
  ]);
};

export const useCloseAmounts = ({
  amountOut,
}: {
  amountOut: HookArg<CurrencyAmount<WrappedTokenInfo>>;
}) => {
  const { selectedLendgine } = useTradeDetails();
  const { address } = useAccount();

  const lendgineInfoQuery = useLendgine(selectedLendgine);
  const balanceQuery = useBalance(selectedLendgine.lendgine, address);
  const positionValue = usePositionValue(selectedLendgine);

  const t = getT();

  return useMemo(() => {
    if (
      !lendgineInfoQuery.data ||
      !balanceQuery.data ||
      !amountOut ||
      !positionValue
    )
      return {};

    const updateLendgineInfo = accruedLendgineInfo(
      selectedLendgine,
      lendgineInfoQuery.data,
      t
    );
    const shares = balanceQuery.data.multiply(amountOut).divide(positionValue);

    const liquidityMinted = liquidityPerShare(
      selectedLendgine,
      updateLendgineInfo
    ).quote(shares);

    const amount0 = updateLendgineInfo.reserve0
      .multiply(liquidityMinted)
      .divide(updateLendgineInfo.totalLiquidity);

    const amount1 = updateLendgineInfo.reserve1
      .multiply(liquidityMinted)
      .divide(updateLendgineInfo.totalLiquidity);

    return { shares, liquidityMinted, amount0, amount1 };
  }, [
    amountOut,
    balanceQuery.data,
    lendgineInfoQuery.data,
    positionValue,
    selectedLendgine,
    t,
  ]);
};
