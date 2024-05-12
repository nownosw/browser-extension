import create from 'zustand';

import { UniqueAsset } from '~/core/types/nfts';

import { createStore } from '../internal/createStore';
import { withSelectors } from '../internal/withSelectors';

export interface SelectedNftState {
  setSelectedNft: (nft?: UniqueAsset) => void;
  selectedNft: UniqueAsset | null;
}

export const selectedNftStore = createStore<SelectedNftState>((set) => ({
  setSelectedNft: (selectedNft?: UniqueAsset) => {
    set({ selectedNft });
  },
  selectedNft: null,
}));

export const useSelectedNftStore = withSelectors(create(selectedNftStore));
