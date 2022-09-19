import { ChainId } from "@dahlia-labs/celo-contrib";
import type { Token } from "@dahlia-labs/token-utils";
import { getContract, getMulticall } from "@dahlia-labs/use-ethers";
import type { Contract, ContractInterface } from "@ethersproject/contracts";
import { useMemo } from "react";
import { useProvider, useSigner } from "wagmi";

import ERC20_ABI from "../abis/erc20.json";
import type { Erc20, Multicall2 } from "../generated";

export function useTokenContractFromAddress(
  tokenAddress: string | undefined,
  withSignerIfPossible: boolean
): Erc20 | null {
  return useContract(
    tokenAddress,
    ERC20_ABI,
    withSignerIfPossible
  ) as Erc20 | null;
}

export function useTokenContract(
  token: Token | undefined,
  withSignerIfPossible: boolean
): Erc20 | null {
  return useContract(
    token?.address,
    ERC20_ABI,
    withSignerIfPossible
  ) as Erc20 | null;
}

export function useMulticall(): Multicall2 {
  const provider = useProvider();
  const chainID = ChainId.Mainnet;
  return getMulticall(chainID, provider);
}

function useContract(
  address: string | undefined,
  ABI: ContractInterface,
  withSignerIfPossible: boolean
): Contract | null {
  const provider = useProvider();
  const signer = useSigner().data;

  return useMemo(() => {
    if (!address) return null;

    return getContract(
      address,
      ABI,
      withSignerIfPossible && signer ? signer : provider
    );
  }, [address, ABI, withSignerIfPossible, signer, provider]);
}
