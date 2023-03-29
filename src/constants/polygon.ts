import type { Currency, Token } from "@uniswap/sdk-core";
import { NativeCurrency } from "@uniswap/sdk-core";
import { utils } from "ethers";

import { chainID } from "../lib/constants";
import { WrappedTokenInfo } from "../lib/types/wrappedTokenInfo";
import { WrappedNative } from "./tokens";

const USDC = new WrappedTokenInfo({
  name: "USDCoin",
  address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  symbol: "USDC",
  decimals: 6,
  chainId: 137,
  logoURI:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
});

const WETH = new WrappedTokenInfo({
  name: "Wrapped Ether",
  address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
  symbol: "WETH",
  decimals: 18,
  chainId: 137,
  logoURI:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
});

const BOB = new WrappedTokenInfo({
  name: "BOB",
  address: "0xB0B195aEFA3650A6908f15CdaC7D92F8a5791B0B",
  symbol: "BOB",
  decimals: 18,
  chainId: 137,
  logoURI:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/0xB0B195aEFA3650A6908f15CdaC7D92F8a5791B0B/logo.png",
});
const USDT = new WrappedTokenInfo({
  name: "Tether USD",
  address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  symbol: "USDT",
  decimals: 6,
  chainId: 137,
  logoURI:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
});
const WBTC = new WrappedTokenInfo({
  name: "Wrapped BTC",
  address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
  symbol: "WBTC",
  decimals: 8,
  chainId: 137,
  logoURI:
    "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png",
});
const GHST = new WrappedTokenInfo({
  name: "Aavegotchi",
  address: "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
  symbol: "GHST",
  decimals: 18,
  chainId: 137,
  logoURI:
    "https://assets.coingecko.com/coins/images/12467/small/ghst_200.png?1600750321",
});

export class Matic extends NativeCurrency {
  protected constructor(chainId: number) {
    super(chainId, 18, "MATIC", "Matic");
  }

  get wrapped(): Token {
    return WrappedNative[chainID.polygon];
  }

  private static _etherCache: { [chainId: number]: Matic } = {};

  static onChain(chainId: number): Matic {
    return (
      this._etherCache[chainId] ??
      (this._etherCache[chainId] = new Matic(chainId))
    );
  }

  equals(other: Currency): boolean {
    return other.isNative && other.chainId === this.chainId;
  }
}

export const polygonConfig = {
  base: {
    factory: utils.getAddress("0x8396a792510a402681812ece6ad3ff19261928ba"),
    lendgineRouter: utils.getAddress(
      "0x6a931466f6C79724CB5E78EaB6E493b6AF189FF0"
    ),
    liquidityManager: utils.getAddress(
      "0x6b0c66824c39766f554F07481B66ca24A54A90E0"
    ),
  },
  interface: {
    uniswapV2: {
      subgraph: "https://api.thegraph.com/subgraphs/name/sameepsi/quickswap06",
      factoryAddress: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
      pairInitCodeHash:
        "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f",
      routerAddress: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
    },
    uniswapV3: {
      subgraph:
        "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon",
      factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      pairInitCodeHash:
        "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54",
      quoterAddress: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    },
    numoenSubgraph:
      "https://api.thegraph.com/subgraphs/name/kyscott18/numoen-polygon",
    wrappedNative: WrappedNative[chainID.polygon],
    native: Matic.onChain(chainID.polygon),
    specialtyMarkets: [
      {
        base: WrappedNative[chainID.polygon],
        quote: WETH,
      },
      { base: USDC, quote: USDT },
      { base: WETH, quote: USDC },
      { base: WBTC, quote: USDC },
      { base: BOB, quote: USDC },
      { base: GHST, quote: USDC },
    ],
    blockFreq: 1,
  },
} as const;
