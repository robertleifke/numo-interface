import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import tw from "twin.macro";

interface Props {
  searchQuery: string;
  onChange: (value: string) => void;
  onClear: () => void;
}
export const SearchInput: React.FC<Props> = ({
  searchQuery,
  onChange,
  onClear,
}) => {
  const showClear = searchQuery.length > 0;
  return (
    <div tw="flex items-stretch focus-within:(ring-black border-black) border border-gray-200 relative bg-white rounded-xl">
      <input
        css={[
          tw`bg-transparent border-none flex-grow focus:(outline-none ring-0 border-0) text-default  placeholder-gray-400 text-lg font-medium appearance-none w-full p-4 pr-0 outline-none overflow-hidden`,
          // showClear && tw`pr-8`,
        ]}
        autoComplete="off"
        placeholder={"Search name or token address"}
        type={"text"}
        value={searchQuery}
        onChange={(e) => onChange(e.target.value)}
      />
      {!showClear && (
        <div tw="absolute h-full right-0 top-0 flex items-center pr-4 text-secondary text-lg pointer-events-none">
          <FontAwesomeIcon icon={faSearch} fixedWidth />
        </div>
      )}
      {showClear && (
        <button
          onClick={() => onClear()}
          type="button"
          tw="z-10 px-4 appearance-none flex items-center text-gray-400 text-xl"
        >
          <FontAwesomeIcon icon={faTimes} fixedWidth />
        </button>
      )}
    </div>
  );
};
