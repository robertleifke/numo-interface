import type { ContractReceipt } from "ethers";
import React from "react";
import { toast } from "react-hot-toast";
import { styled } from "twin.macro";
import type { Address } from "wagmi";
import { useNetwork } from "wagmi";

export type BeetTx = {
  title: string;
  description: string;
  callback: (toast: TxToast) => Promise<ContractReceipt>;
};
export type BeetStage = { title: string; parallelTxs: readonly BeetTx[] };

export type TxToast = {
  id: string;
  title: string;
  description: string;
  humanCount: string;
};
type TxSending = TxToast & { status: "sending" };
type TxSuccess = TxToast & { status: "success"; receipt: ContractReceipt };
type TxPending = TxToast & { status: "pending"; hash: string };
type TxError = TxToast & { status: "error"; error?: string };

const genRanHex = (size: number) => {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < size; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

export const Beet = async (stages: readonly BeetStage[]) => {
  const random = genRanHex(12); // to prevent toast collisions

  const totaltx = stages.reduce((acc, cur) => acc + cur.parallelTxs.length, 0);

  for (const [stageIndex, stage] of stages.entries()) {
    const previousTxs = [...Array(stageIndex).keys()].reduce(
      (acc, i) => acc + (stages[i]?.parallelTxs.length ?? 0),
      0
    );

    try {
      await Promise.all(
        stage.parallelTxs.map(
          async (beetTx, i) =>
            await beetTx.callback({
              id: `${random}-${stageIndex}-${i}`,
              title: beetTx.title,
              description: beetTx.description,
              humanCount: `${1 + i + previousTxs}/${totaltx}`,
            })
        )
      );
    } catch (err) {
      console.error(err);
      return;
    }
  }
};

export class DefaultToasterWrapper {
  txSending(tx: Omit<TxSending, "status">) {
    toast.loading(this._buildToastContainer({ ...tx, status: "sending" }), {
      id: tx.id,
      duration: 10_000,
      position: "bottom-left",
    });
  }

  txPending(tx: Omit<TxPending, "status">) {
    toast.loading(this._buildToastContainer({ ...tx, status: "pending" }), {
      id: tx.id,
      duration: 10_000,
      position: "bottom-left",
    });
  }

  txError(tx: Omit<TxError, "status">) {
    toast.error(this._buildToastContainer({ ...tx, status: "error" }), {
      id: tx.id,
      duration: 6000,
      position: "bottom-left",
    });
    return;
  }

  txSuccess(tx: Omit<TxSuccess, "status">) {
    toast.success(this._buildToastContainer({ ...tx, status: "success" }), {
      id: tx.id,
      duration: 3000,
      position: "bottom-left",
    });
  }

  dismiss(id: string): void {
    toast.dismiss(id);
  }

  private _buildToastContainer(
    tx: TxSending | TxSuccess | TxError | TxPending
  ) {
    return (
      <ToastContainer tw="flex flex-col overflow-hidden">
        <div tw="flex font-semibold justify-between items-center">
          <span tw="flex items-center gap-1">
            {tx.title}
            <span tw="flex text-sm text-secondary">{tx.humanCount}</span>
          </span>
          <ToastExitButton onClick={() => toast.dismiss(tx.id)}>
            ×
          </ToastExitButton>
        </div>

        <div tw="flex text-secondary">
          {tx.status === "success" ? (
            <div>
              View Transaction:
              <AddressLink address={tx.receipt.transactionHash} data="tx" />
            </div>
          ) : tx.status === "pending" ? (
            <div>
              View Transaction:
              <AddressLink address={tx.hash} data="tx" />
            </div>
          ) : tx.status === "error" ? (
            tx.error ?? tx.description
          ) : (
            tx.description
          )}
        </div>
      </ToastContainer>
    );
  }
}

export const AddressLink: React.FC<{
  address: Address | string;
  data: "tx" | "address";
  className?: string;
}> = ({ address, className, data }) => {
  const { chain } = useNetwork();
  return (
    <a
      href={`${
        chain?.blockExplorers?.default.url ?? "https://arbiscan.io"
      }/${data}/${address}`}
      rel="noopener noreferrer"
      target="_blank"
      className={className}
      tw="underline"
    >
      {address.slice(0, 6)}...{address.slice(address.length - 4)}
    </a>
  );
};

const ToastContainer = styled.div`
  width: 290px;
`;

const ToastExitButton = styled.span`
  font-size: 20px;
  cursor: pointer;
  color: #888d9b;

  &:hover {
    color: #000;
  }
`;
