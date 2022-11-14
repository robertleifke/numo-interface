import { ChainId } from "@dahlia-labs/celo-contrib";
import { CELO, CUSD } from "@dahlia-labs/celo-tokens";
import type { TokenAmount } from "@dahlia-labs/token-utils";
import { Price, Token } from "@dahlia-labs/token-utils";
import { useCallback } from "react";
import { createContainer } from "unstated-next";

export interface IMarket {
  token: Token;

  address: string;
  pair: IPair;
  referenceMarket: string;
}

export interface IMarketInfo {
  totalLiquidity: TokenAmount;
  totalLiquidityBorrowed: TokenAmount;
  rewardPerLiquidityStored: TokenAmount;
  totalSupply: TokenAmount;
  lastUpdate: number;
}

export interface IMarketUserInfo {
  tokenID: number;
  liquidity: TokenAmount;
  market: IMarket;
}

export interface IPair {
  speculativeToken: Token;
  baseToken: Token;

  lp: Token;

  bound: Price;
  baseScaleFactor: number;
  speculativeScaleFactor: number;

  address: string;
}

export interface IPairInfo {
  speculativeAmount: TokenAmount;
  baseAmount: TokenAmount;

  totalLPSupply: TokenAmount;
}

interface Environment {
  markets: readonly IMarket[];
}

const LongCelo: IMarket = {
  token: new Token({
    name: "Numoen Lendgine",
    symbol: "CELO²",
    decimals: 18,
    chainId: ChainId.Mainnet,
    address: "0x83973A67C2F38CABcbD91181f1D9ed62917646A8",
  }),

  address: "0x83973A67C2F38CABcbD91181f1D9ed62917646A8",
  pair: {
    speculativeToken: CELO[ChainId.Mainnet],
    baseToken: CUSD[ChainId.Mainnet],

    lp: new Token({
      name: "Numoen LP",
      symbol: "NLP",
      decimals: 18,
      chainId: ChainId.Mainnet,
      address: "0xa3334Bb438096d7fa18b40118347fAF35c182207",
    }),

    bound: new Price(CUSD[ChainId.Mainnet], CELO[ChainId.Mainnet], 1, 5),
    baseScaleFactor: 18,
    speculativeScaleFactor: 18,
    address: "0xa3334Bb438096d7fa18b40118347fAF35c182207",
  },
  referenceMarket: "0x1e593f1fe7b61c53874b54ec0c59fd0d5eb8621e",
};

const ShortCelo: IMarket = {
  token: new Token({
    name: "Numoen Lendgine",
    symbol: "cUSD²",
    decimals: 18,
    chainId: ChainId.Mainnet,
    address: "0x40FCde0c9619969834BBBC63b7816716ace4B194",
  }),

  address: "0x40FCde0c9619969834BBBC63b7816716ace4B194",
  pair: {
    speculativeToken: CUSD[ChainId.Mainnet],
    baseToken: CELO[ChainId.Mainnet],

    lp: new Token({
      name: "Numoen LP",
      symbol: "NLP",
      decimals: 18,
      chainId: ChainId.Mainnet,
      address: "0x8daE985062Ada6e316dC168012bA14EF19fB1Ac4",
    }),

    bound: new Price(CELO[ChainId.Mainnet], CUSD[ChainId.Mainnet], 1, 5),
    baseScaleFactor: 18,
    speculativeScaleFactor: 18,
    address: "0x8daE985062Ada6e316dC168012bA14EF19fB1Ac4",
  },
  referenceMarket: "0x1e593f1fe7b61c53874b54ec0c59fd0d5eb8621e",
};

export const FACTORY = "0x2A4a8ea165aa1d7F45d7ac03BFd6Fa58F9F5F8CC";
export const LIQUIDITYMANAGER = "0x8144a4e2c3f93c55d2973015a21b930f3b636ebd";
export const LENDGINEROUTER = "0xf6dc5f1c2afc43c74e1e2b4e5bbdd98b2524671f";
export const GENESIS = 15948000;

export const useAddressToMarket = (
  address: string | null | undefined
): IMarket | null => {
  const { markets } = useEnvironment();
  if (!address) return null;

  return markets.find((m) => m.address === address) ?? null;
};

export const useGetAddressToMarket = () => {
  const { markets } = useEnvironment();
  return useCallback(
    (address: string | null | undefined) => {
      if (!address) return null;
      return markets.find((m) => m.address === address) ?? null;
    },
    [markets]
  );
};

export const useGetSpeculativeToMarket = () => {
  const { markets } = useEnvironment();
  return useCallback(
    (speculative: Token) => {
      return markets.find((m) => m.pair.speculativeToken === speculative);
    },
    [markets]
  );
};

export const useIsMarket = (address: string | null): boolean => {
  const environment = useEnvironment();
  if (address === null) return false;
  return environment.markets.map((m) => m.address).includes(address);
};

const useEnvironmentInternal = (): Environment => {
  return {
    markets: [LongCelo, ShortCelo] as const,
  };
};

export const { Provider: EnvironmentProvider, useContainer: useEnvironment } =
  createContainer(useEnvironmentInternal);
