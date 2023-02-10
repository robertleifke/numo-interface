import { useTradeDetails } from "..";
import { Buy } from "./Buy";
import { Close } from "./Close";

export const Trade: React.FC = () => {
  const { close } = useTradeDetails();

  return close ? <Close /> : <Buy />;
};
